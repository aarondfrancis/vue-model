var _ = require('lodash');
var DataPipeline = require('./DataPipeline');
var ModelErrors = require('./ModelErrors');

/**
 * Model Constructor
 * @param data
 * @param settings
 * @returns Object
 * @constructor
 */
var Model = function (data, settings) {
    var self = this;

    self.data = _.toPlainObject(data);
    self.settings = _.toPlainObject(settings);

    self.settings.excludeKeys.push(self.settings.apiKey);
    self.settings.actions = _(self.settings.actions)
        // reject actions that are set to false
        .pickBy()

        // Extend action with defaults and append
        // the "name" key for later convenience
        .forOwn(function(action, key) {
            self.settings.actions[key] = _.defaultsDeep(action, self.settings.actionDefaults, {
                name: key
            });
        });

    // Set the API property and make it reactive
    self.api = self.buildApi();
    Vue.set(self.data, self.settings.apiKey, self.api);

    // Give back just the data
    return self.data;
};

/**
 * Make the public api that we attach to the model data
 * @returns Object
 */
Model.prototype.buildApi = function() {
    var self = this;
    var cache;

    var api = {
        editing: false,
        inProgress: false
    };

    _.forOwn(self.settings.actions, function(action, key){
        (function(key){
            // Set loading indicators for each action
            api[key + 'InProgress'] = false;

            // Expose each action in the API
            api[key] = function () {
                return self.act(key);
            }
        })(key);
    });

    /**
     * Create a copy of the data in the model, without any
     * of the Model extras
     * @returns Object
     */
    api.copy = function() {
        return _.omit(self.data, self.settings.excludeKeys);
    };

    /**
     * Toggles a flag and copies the data to the cache
     */
    api.edit = function() {
        api.editing = true;
        cache = api.copy();
    };

    /**
     * Undo any editing that was being done
     */
    api.cancel = function () {
        api.apply(cache);
        api.editing = false;
    };

    /**
     * Update the data object using Vue.set
     * @param newData
     */
    api.apply = function(newData) {
        _(newData)
            // Exclude our API key and any others
            .omit(self.settings.excludeKeys)

            // Skip any values that haven't changed
            .omitBy(function(value, key) {
                return value === self.data[key];
            })

            // Update the changed keys
            .forOwn(function(value, key){
                Vue.set(self.data, key, value);
            });
    };
    
    api.errors = new ModelErrors();

    api.data = new DataPipeline();
    api.data[self.settings.apiKey] = api;
    api.data['forAction'] = function(name) {
        return self.getDataForAction(name)
    };

    return api;
};

/**
 * Perform an HTTP action
 * @param name
 * @returns Promise
 */
Model.prototype.act = function(name) {
    var self = this;
    var api = self.api;
    var action = self.getAction(name);

    if (self.settings.preventSimultaneousActions && api.inProgress) {
        self.emit('prevented', {
            name: name,
            action: action
        });

        self.emit(name + '.prevented', {
            action: action
        });
        
        return $.when();
    }

    if (_.isFunction(action.before)) {
        if(action.before.apply(self) === false) {
            self.emit(name + '.canceled');
            return $.when();
        }
    }

    api.inProgress = true;
    api[name + 'InProgress'] = true;

    var sent = self.getDataForAction(name);

    // Immediately after we get the data, clear
    // the pipeline. Pipeline transformations
    // are added per action per request
    api.data.pipeline.clear();

    self.emit(name + '.before', {
        sending: sent
    });

    var
        headers = self.getSettingsProperty('headers', action),
        params = self.getSettingsProperty('params', action),
        route = self.getRoute(action) + self.getParams(params),
        contentType = self.getContentType(action);

    if (contentType != null && contentType.indexOf('application/json') > -1) {
        sent = JSON.stringify(sent);
    }

    var promise = $.ajax(route, {
        headers: headers,
        type: action.method,
        data: sent,
        contentType: contentType
    });

    // If we are to apply the result from the server,
    // chain onto the promise to do so
    if (action.apply) {
        promise.done(function(data) {
            api.apply(data);
        });
    }

    if (action.validation) {
        promise
            .always(function() {
                api.errors.clear();
            })

            .fail(function(xhr){
                if (!self.settings.validationErrors.isValidationError(xhr)) {
                    return;
                }

                var errors = self.settings.validationErrors.transformResponse(xhr);
                api.errors.set(errors);
            });
    }

    promise
        .done(function(data) {
            self.emit(name + '.success', {
                sent: sent,
                received: data
            });
            api.editing = false;
        })

        .fail(function(xhr) {
            self.emit(name + '.error', {
                sent: sent,
                received: xhr
            });
        })

        .always(function (data) {
            self.emit(name + '.complete', {
                sent: sent,
                received: data
            });

            if(_.isFunction(action.after)) {
                action.after.apply(self, [data]);
            }

            api.inProgress = false;
            api[name + 'InProgress'] = false;
        });

    return promise;
};

Model.prototype.getSettingsProperty = function(name, action) {
    var actionProperty = action[name];
    var globalProperty = this.settings[name];

    if (_.isFunction(actionProperty)) {
        actionProperty = actionProperty.call(this, action);
    }

    if (_.isFunction(globalProperty)) {
        globalProperty = globalProperty.call(this, action);
    }

    actionProperty = _.defaultsDeep(_.toPlainObject(actionProperty), _.toPlainObject(globalProperty));

    return _.pickBy(actionProperty);
};

Model.prototype.getRoute = function(action) {
    var baseRoute = action.baseRoute || this.settings.baseRoute;
    return this.interpolate(baseRoute + action.route);
};

Model.prototype.getParams = function (params) {
    if (_.isString(params)) {
        return '?' + params;
    } else if (_.isObject(params)) {
        return '?' + $.param(params);
    } else {
        return '';
    }
};

Model.prototype.getContentType = function (action) {
    return action.contentType || this.settings.contentType;
};

Model.prototype.getAction = function(name) {
    var action = this.settings.actions[name];

    if (!_.isPlainObject(action)) {
        return false;
    }

    return action;
};

Model.prototype.getDataForAction = function(name) {
    var self = this;
    var api = self.api;

    var action = self.getAction(name);

    if (!action) {
        return {};
    }

    // Store a copy of the current pipeline, since
    // we're going to be modifying it.
    var pipeline = api.data.pipeline.get();

    // Default to sending the entire object
    var data = api.copy();

    if (_.isFunction(action.pipeline)) {
        api.data.pipeline.clear();

        // Pass the DataPipeline into the action's pipeline step
        action.pipeline(api.data);

        // Put the rest of the pipeline back in place
        _.each(pipeline, function(step) {
            api.data.pipeline.appendStep(step.name, step.args);
        });
    }

    var result = api.data.pipeline.process(data);

    // Set the pipeline back to what it was
    api.data.pipeline.set(pipeline);

    // Return the pipeline-processed data
    return result;
};

/**
 * Emit an event
 * @param action
 * @param data
 */
Model.prototype.emit = function (action, data) {
    data = data || {};

    if (this.settings.eventPrefix) {
        action = this.settings.eventPrefix + '.' + action;
    }
    
    this.settings.emitter(action, data);
};

/**
 * Parse a route
 * @param template
 * @returns string
 */
Model.prototype.interpolate = function (template) {
    _.templateSettings.interpolate = /{([\s\S]+?)}/g;
    return _.template(template)(this.api.copy());
};

module.exports = Model;