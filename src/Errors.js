var _ = require('lodash');
var Vue = require('vue');

module.exports = class Errors {

    constructor(errors) {
        this.set(errors);
    }

    set (errors) {
        if (_.isEmpty(errors)) {
            errors = {};
        }

        if (!_.isPlainObject(errors)) {
            throw new Error('ModelErrors data must be a plain object');
        }

        for (const [field, messages] of Object.entries(errors)) {
            errors[field] = _.castArray(messages);
        }

        Vue.set(this, 'errors', errors);
    }

    all() {
        return this.errors;
    }

    flat() {
        var flat = [];

        for (const [field, messages] of Object.entries(this.errors)) {
            for (var i = 0; i < messages.length; i++) {
                flat.push({
                    field: field,
                    message: messages[i]
                });
            }
        }

        return flat;
    }

    any() {
        return this.flat().length > 0;
    }

    has(field) {
        return !!_.get(this.errors, field, []).length;
    }

    get (field) {
        return _.get(this.errors, field, []);
    }

    first(field) {
        return _.head(this.get(field));
    }

    clear(field) {
        if (_.isUndefined(field)) {
            this.errors = {};
            return;
        }

        this.errors[field] = [];
    }

    add(field, message) {
        return this.push(field, message);
    }

    push(field, message) {
        Vue.set(this.errors, field, this.get(field).concat(_.castArray(message)));
    }

}