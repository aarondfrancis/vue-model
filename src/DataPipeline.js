var _ = require('lodash');

var applicators = {
    none: function() {
        return {};
    },

    only: function(data, args) {
        if (_.isString(args[0])) {
            args[0] = [args[0]];
        }

        if (_.isArray(args[0])) {
            return _.pick(data, args[0]);
        }

        return _.toPlainObject(args[0]);
    },

    with: function(data, args) {
        return _.defaultsDeep(_.toPlainObject(args[0]), data);
    },

    without: function(data, args) {
        if (_.isString(args[0])) {
            args[0] = [args[0]];
        }

        if (!_.isArray(args[0])) {
            return data;
        }

        return _.omit(data, args[0]);
    },

    callback: function(data, args) {
        if (! _.isFunction(args[0])) {
            return data;
        }

        // Callback is the first argument
        var fn = args[0];

        // Replace the callback function with the
        // current data.
        args[0] = data;

        return _.toPlainObject(fn.apply(fn, args));
    }
};

var DataPipeline = function() {
    var pipeline = [];

    var api = {
        pipeline: {
            process: function(data) {
                _.each(pipeline, function(transform) {
                    var applicator = applicators[transform.name];

                    if (!applicator) {
                        return;
                    }

                    if (!_.isPlainObject(data)) {
                        data = {};
                    }

                    data = applicator(data, transform.args);
                });

                return data;
            },

            clear: function() {
                pipeline = [];
                return api;
            },

            prependStep: function(name, args) {
                pipeline.unshift({
                    name: name,
                    args: args
                });

                return api;
            },

            appendStep: function(name, args) {
                pipeline.push({
                    name: name,
                    args: args
                });

                return api;
            },

            get: function() {
                return pipeline;
            },

            set: function(newPipeline) {
                if (!_.isArray(newPipeline)) {
                    newPipeline = [];
                }

                pipeline = newPipeline;
                return api;
            }
        }
    };

    _.forOwn(applicators, function(value, key) {
        api[key] = (function(key) {
            return function() {
                return api.pipeline.appendStep(key, Array.prototype.slice.call(arguments));
            }
        })(key)
    });

    return api;
};


module.exports = DataPipeline;