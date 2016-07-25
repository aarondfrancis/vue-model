module.exports = {
    // The key that contains all of our
    // vue-model specific data
    apiKey: '$',

    // Any keys we don't want to send up to the server
    // or apply from the server. Often, this can be
    // used for related models, etc.
    excludeKeys: [],

    // Prepended to each of the action routes
    baseRoute: '',

    // Prepended to each event that gets emitted
    eventPrefix: '',

    // Function by which the event gets emitted
    emitter: 'emit',

    // HTTP Headers that get set on each action.
    // This can be a plain object or a callback
    // that returns a plain object.
    headers: {},

    // Prevent an action from being invoked while
    // another action is still running
    preventSimultaneousActions: true,

    // Default HTTP Actions that every model gets
    actions: {
        list: {
            method: 'GET',
            route: '',
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        },
        create: {
            method: 'POST',
            route: '',
        },
        fetch: {
            method: 'GET',
            route: '/{id}',
            apply: true,
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        },
        update: {
            method: 'PUT',
            route: '/{id}',
            apply: true
        },
        destroy: {
            method: 'DELETE',
            route: '/{id}',
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        }
    },

    // Base defaults for every action
    actionDefaults: {
        apply: false,
        validation: true,
        headers: {},
        before: function() {
            //
        },
        after: function() {
            //
        }
    },

    // Model validation errors coming from the server
    validationErrors: {
        // Function to determine whether or not an
        // error response is a validation error.
        // 422 is the correct status code, so if
        // you use Laravel, no need to update this.
        isValidationError: function(response) {
            return response.status === 422;
        },

        // The error object should have the field names
        // as the keys and an array of errors as the
        // values. Laravel does this automatically.
        transformResponse: function(response) {
            return response.data;
        }
    }
};