var _ = require('lodash');
var Bus = require('./PubSub');
var setNested = require('./lib/set-nested');

class VueModel {
    constructor() {
        this.bus = Bus();
        this.registry = {};
    }

    register(name, definition) {
        definition = _.toPlainObject(definition);

        // Set the name of the model as the Event Prefix,
        // but only if there isn't a prefix set yet
        if (! _.get(definition, 'http.eventPrefix', false)) {
            _.set(definition, 'http.eventPrefix', name);
        }

        this.registry[name] = definition;
    }

    $model(VueInstance, name, data, definitionOverrides) {
        if (!_.has(this.registry, name)) {
            throw new Error("[vue-model] Unrecognized model: " + name);
        }

        // Order of importance for options
        // 1. Explicitly passed in
        // 2. Model definition
        // 3. Defaults
        var definition = _.defaultsDeep(...[
            _.toPlainObject(definitionOverrides),
            this.registry[name],
            this.classes.defaults
        ]);

        var model = new this.classes.model(data, definition, this.classes);
        model.setBus(this.bus);

        // Only return the data
        return model.data;
    }

    $models(VueInstance, name, datas, definitionOverrides) {
        return datas.map(data => VueInstance.$model(name, data, definitionOverrides));
    }

    $addModelListeners(VueInstance, listeners) {
        this.modelListeners(VueInstance, true, listeners);
    }

    $removeModelListeners(VueInstance, listeners) {
        this.modelListeners(VueInstance, false, listeners);
    }

    modelListeners(VueInstance, add, listeners) {
        var method = add ? 'on' : 'off';

        _.castArray(listeners)
            .map(listener => {
                // When the handler has the same name as the
                // event itself, a single string suffices
                if (_.isString(listener)) {
                    listener = {
                        [listener]: listener
                    }
                }

                return listener;
            })

            // Reduce down to a single array
            .reduce((carry, listener) => {
                for (let [event, handler] of Object.entries(listener)) {
                    // Handlers that are strings are methods on the instance
                    if (_.isString(handler)) {
                        handler = VueInstance[handler];
                    }

                    carry.push({
                        event: event,
                        handler: handler
                    });
                }
                return carry;
            }, [])
            // Call the method on the bus
            .map(listener => {
                console.log(method, listener);
                this.bus[method](listener.event, listener.handler);
            });
    }

    getOptions(VueInstance) {
        var options = _.clone(_.get(VueInstance.$options, 'models', []));

        // If the `models` option is an array, we assume
        // that's a set of models to register
        if (_.isArray(options)) {
            options = {
                register: options
            }
        }

        return _.defaults(options, {
            register: [],
            listeners: []
        });
    }

    created(VueInstance) {
        this.getOptions(VueInstance)
            .register
            .map(model => {
                return _.isString(model) ? {
                    type: model,
                    key: model,
                } : model;
            })
            .map(model => {
                var data = VueInstance[model.key];
                var method = _.isArray(data) ? '$models' : '$model';
                VueInstance[model.key] = VueInstance[method](model.type, data, model.options);
            });
    }

    mounted(VueInstance) {
        VueInstance.$addModelListeners(this.getOptions(VueInstance).listeners);
    }

    beforeDestroy(VueInstance) {
        VueInstance.$removeModelListeners(this.getOptions(VueInstance).listeners);
    }

    // Called by Vue to install the plugin
    install(Vue, options) {
        // If the keys 'models' & 'classes' aren't present, we make an
        // assumption that the object passed in is a map of models
        if (!_.has(options, 'models') && !_.has(options, 'classes')) {
            options = {
                models: options,
                classes: {}
            }
        }

        this.classes = _.defaults(options.classes, {
            model: require('./Model'),
            errors: require('./Errors'),
            defaults: require('./Defaults'),
        });

        var registry = _.get(options, 'models', {});
        for (const [name, definition] of Object.entries(registry)) {
            this.register(name, definition);
        }

        // Our augmented `Vue.set` method
        Vue.setNested = setNested;

        // Methods where we want `this` to be equal to VueModel,
        // but still have access to the Vue instance that called
        // it, via the first argument
        var bind = name => {
            var VueModel = this;
            return function (...args) {
                var partial = (function (instance) {
                    var method = VueModel[name].bind(VueModel);
                    return _.partial(method, instance);
                })(this);
                return partial(...args);
            }
        }

        Vue.prototype.$model = bind('$model');
        Vue.prototype.$models = bind('$models');
        Vue.prototype.$addModelListeners = bind('$addModelListeners');
        Vue.prototype.$removeModelListeners = bind('$removeModelListeners');

        Vue.prototype.$bus = () => {
            console.log(this.bus._subs);
        };

        Vue.mixin({
            created: bind('created'),
            mounted: bind('mounted'),
            beforeDestroy: bind('beforeDestroy')
        });

        Vue.models = {
            register: this.register,
            addEventListener: this.bus.on,
            removeEventListener: this.bus.off,
        };
    }
}

module.exports = new VueModel();