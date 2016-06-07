var _ = require('lodash');

module.exports = function () {
    var api = {
        hasAny: function () {
            return !_.isEmpty(api.all);
        },

        all: {},

        has: function (field) {
            return _.has(api.all, field)
                && _.isArray(_.get(api.all, field))
                && _.get(api.all, field).length;
        },

        first: function (field) {
            if (api.has(field)) {
                return _.get(api.all, field)[0];
            }
        },

        get: function(field) {
            if (api.has(field)) {
                return _.get(api.all, field);
            }
        },

        clear: function (field) {
            if (_.isString(field)) {
                if (api.has(field)) {
                    api.all[field] = [];
                }
                return;
            }

            api.all = {};
            return;
        },

        push: function(field, value) {
            if (api.has(field)) {
                var errors = _.get(api.all, field);
                errors.push(value);

                _.set(api.all, field, errors);

                return;
            }

            api.all[field] = [value];
        },

        set: function(collection) {
            api.all = _.toPlainObject(collection);
        }
    }

    return api;
};