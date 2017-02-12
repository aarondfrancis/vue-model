(function() {
    var _ = require('lodash');
    var Model = require('./Model');
    var libraryDefaults = require('./ModelDefaults');
    var userOptions = {};
    var modelRegistry = {
        '__ad-hoc': {}
    };

    var registerModel = function(type, options) {
        options = _.toPlainObject(options);

        // Set the type of the model as the Event Prefix,
        // but only if there isn't a prefix set yet
        options = _.defaultsDeep(options, {
            eventPrefix: type
        });

        modelRegistry[type] = options;
    };

    var createModel = function(type, data, options) {
        // Vue instance
        var vm = this;

        // Ad-hoc model creation
        if (!_.isString(type) && _.isUndefined(options)) {
            options = data;
            data = type;
            type = '__ad-hoc';
        }

        if (!_.has(modelRegistry, type)) {
            throw "[vue-model] Unrecognized Model " + type;
            return;
        }

        options = _.toPlainObject(options);

        // Order of importance for options
        // 1. Explicitly passed in
        // 2. Model options
        // 3. User Defaults
        // 4. Library Defaults
        options = _.defaultsDeep(options, modelRegistry[type], userOptions, libraryDefaults);

        // If the developer wishes to use one of the Vue event methods,
        // they are welcome to do that by passing in just the name
        // of the method, which we will transform to a function
        if (_.isString(options.emitter)) {
            var isVueMethod = _.indexOf(['emit', 'broadcast', 'dispatch'], options.emitter) > -1;
            if (!isVueMethod) {
                throw "[vue-model] " + options.emitter + ' is not a Vue event method.';
                return;
            }


            var method = options.emitter;
            options.emitter = function(event, data) {
                vm['$' + method](event, data);
            };

            options.dispatcher = function(event, data) {
                vm['$dispatch'](event, data);
            };
        }

        return new Model(data, options);
    };

    var createModels = function(type, datas, options) {
        // Vue instance
        var vm = this;

        return _.map(datas, function(data) {
            return createModel.apply(vm, [type, data, options]);
        });
    };

    var automaticallyCreateModels = function() {
        // Vue instance
        var vm = this;
        var models = this.$options.models;

        if (!models) {
            return;
        }

        _.each(models, function(model) {
            if (_.isString(model)) {
                model = {
                    dataKey: model,
                    type: model,
                    options: {}
                }
            }

            vm[model.dataKey] = vm.$model(model.type, vm[model.dataKey], model.options);
        });
    };

    var install = function(Vue, options) {
        Vue.prototype.$model = createModel;
        Vue.prototype.$models = createModels;

        userOptions = _.toPlainObject(options);

        Vue.mixin({
            created: automaticallyCreateModels
        });

        Vue.models = {
            register: registerModel
        };
    };

    module.exports = install
})();