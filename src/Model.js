var _ = require('lodash');
var axios = require('axios');
var Vue = require('vue');
require('promise.prototype.finally').shim();
require('./lib/promise-delay');

module.exports = class Model {
    constructor(data, settings, classes) {
        this.classes = classes;
        this.settings = settings;

        this.setData(data);
        this.setComputed();
        this.setMethods();
        this.setHttp();

        Vue.set(this, 'data', this.data);
    }

    setBus(bus) {
        this.bus = bus;
    }

    setData(data) {
        this.data = _.defaultsDeep(...[
            _.toPlainObject(data),

            // Initialize all the attributes as nulls
            this.settings.attributes.reduce((carry, key) => _.set(carry, key, null), {}),

            // Set the key that will contain our Errors class
            _.set({}, this.settings.http.errorKey, new this.classes.errors)
        ]);
    }

    setComputed() {
        for (const [key, method] of Object.entries(this.settings.computed)) {
            Object.defineProperty(this.data, key, {
                enumerable: true,
                get: method.bind(this.data)
            });
        }
    }

    setMethods() {
        for (const [key, method] of Object.entries(this.settings.methods)) {
            this.data[key] = method.bind(this.data);
        }
    }

    setHttp() {
        // Exclude any actions set to false
        var actions = _.pickBy(this.settings.http.actions);

        var http = _.get(this.data, 'http', {});
        var defaults = this.settings.http.actionDefaults;

        for (const [key, definition] of Object.entries(actions)) {
            http[key] = runtimeArgs => this.request(runtimeArgs, _.defaultsDeep(definition, defaults), key);
            http[key + 'InProgress'] = false;
        }

        // One global HTTP indicator
        Object.defineProperty(http, 'inProgress', {
            enumerable: true,
            get: () => {
                return Object
                    .keys(actions)
                    // Turn the key into the name of the indicator
                    .map(key => http[key + 'InProgress'])
                    // If any are true, then it's true
                    .reduce((carry, key) => carry || key)
            }
        });

        this.data.http = http;
    }

    request(runtimeArgs, definition, key) {
        var canceled = false;

        this.emit([key, 'before'], {
            cancel: () => canceled = true
        });

        if (canceled) {
            return;
        }

        this.data.http[key + 'InProgress'] = true;

        var axios = this.getAxiosInstance();
        var config = this.getAxiosConfiguration(runtimeArgs, definition, key);

        var promise = axios.request(config)
            .takeAtLeast(this.settings.http.takeAtLeast)
            .catch(error => this.requestFailed(error, definition, key))
            // Always set the progress indicator to false and send the final event
            .finally(() => {
                this.data.http[key + 'InProgress'] = false
                this.emit([key, 'complete']);
            });

        if (definition.apply) {
            // Apply the results of the response to the model
            promise = promise.then(response => this.apply(response));
        }

        // Emit a success event _after_ the response has
        // been applied (if applicable)
        promise = promise.then(response => {
            this.emit([key, 'success'], {response});
            return response;
        })

        return promise;
    }

    getAxiosInstance() {
        return axios.create();
    }

    getAxiosConfiguration(runtimeArgs, definition, key) {
        var baseRoute = definition.baseRoute || this.settings.http.baseRoute || '';

        if (_.startsWith(definition.route, '/')) {
            baseRoute = '';
        }

        var config = {
            method: definition.method,
            url: this.interpolate(baseRoute + definition.route),
        }

        var key = (['PUT', 'POST', 'PATCH'].indexOf(config.method.toUpperCase()) == -1) ? 'params' : 'data';
        config[key] = this.getRequestPayload(definition, runtimeArgs);

        return this.settings.http.axios.call({
            // Share some methods that might be helpful
            interpolate: this.interpolate,
            getRequestData: this.getRequestPayload
        }, config, key, definition, runtimeArgs);
    }

    getRequestPayload(definition) {
        // Shorthand for no data
        if (definition.data === false) {
            definition.data = {
                only: []
            }
        }

        // Shorthand for only keys
        if (_.isArray(definition.data)) {
            definition.data = {
                only: definition.data
            }
        }

        var result = key => {
            var value = _.get(definition, 'data.' + key);
            return _.isFunction(value) ? value.call(this.data, definition) : value;
        }

        // Base level for every request is the value the
        // developer put in as the model's attributes
        var payload = this.settings.attributes;

        var only = result('only');
        if (_.isArray(only)) {
            payload = only;
        }

        var without = result('without');
        if (_.isArray(without)) {
            payload = _.difference(payload, without);
        }

        var wth = result('with');
        if (_.isArray(wth)) {
            payload = _.union(payload, wth);
        }

        payload = payload
            .map(value => {
                if (!_.isString(value)) {
                    return value;
                }

                return {
                    [value]: _.get(this.data, value)
                }
            })
            .reduce(_.merge, {});

        for (const [key, value] of Object.entries(payload)) {
            if (_.isFunction(value)) {
                payload[key] = value.call(this.data);
            }
        }

        var custom = _.get(definition, 'data.custom');
        if (_.isFunction(custom)) {
            payload = custom.call(this.data, payload, definition);
        }

        return payload;
    }

    requestFailed(error, definition, key) {
        this.emit([key, 'error'], {error});

        if (definition.validation) {
            this.setValidationErrors(error);
        }

        return Promise.reject(error);
    }

    setValidationErrors(error) {
        var http = this.settings.http;
        if (!http.isValidationError(error)) {
            return;
        }
        var errors = http.getErrorsFromResponse(error.response);

        // errorKey can be a dot delimited path
        Vue.setNested(this.data, http.errorKey, new this.classes.errors(errors));
    }

    apply(response) {
        var data = this.settings.http.getDataFromResponse(response);
        for (const [key, value] of Object.entries(data)) {
            Vue.set(this.data, key, value);
        }

        // Give the response back so we can keep chaining promises
        return response;
    }

    emit(action, data) {
        action = [this.settings.http.eventPrefix]
            .concat(_.castArray(action))
            .filter(_.identity)
            .join('.');

        data = _.defaultTo(data, {});
        data.model = this.data;

        this.bus.emit(action, data);
    }

    /**
     * Interpolate a string with the model's data
     * @param template
     * @returns string
     */
    interpolate(template) {
        _.templateSettings.interpolate = /{([\s\S]+?)}/g;
        return _.template(template)(this.data);
    }

}