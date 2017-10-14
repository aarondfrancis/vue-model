var _ = require('lodash');

module.exports = {
    // The default model attributes. We'll initialize them all to
    // null if there are no values for them. This is the starting
    // point for the data that is sent to the server
    attributes: [],

    methods: {},

    computed: {},

    http: {
        baseRoute: null,

        eventPrefix: null,

        // The _minimum_ amount of time that a successful ajax
        // request should take. If the request fails it will
        // return immediately, but if it's successful it won't
        // return until `takeAtLeast` milliseconds have passed
        takeAtLeast: 0,

        // Return an axios request configuration object
        // https://github.com/axios/axios#request-config
        axios(configuration, action, definition, runtimeArgs) {
            return configuration;
        },

        // Turn an axios response into the model data
        getDataFromResponse(response) {
            return response.data.data;
        },

        // Where you want your errors to live. You can use a
        // dot delimited path or put them at the top level
        errorKey: 'http.errors',

        // Determine whether an error response is a model
        // validation error. 422 is the correct status code,
        // so if you use Laravel, no need to update this.
        isValidationError (error) {
            return _.get(error, 'response.status') === 422;
        },

        // The error object should have the field names
        // as the keys and an array of errors as the
        // values. This default is set for Laravel 5.5.
        getErrorsFromResponse(response) {
            return response.data.errors;
        },

        // Base defaults for every action
        actionDefaults: {
            // Apply the response data to the model
            apply: false,

            // The server validates this request and could
            // return a validation error in response
            validation: true,

            // Modify what data we should send to the server
            data: {
                // only: [],
                // with: [],
                // without: [],
                // custom: function(data, definition) {
                //     return data;
                // }
            }
        },

        // Default HTTP Actions that every model gets. You can
        // set an action to `false` to disable it in a model
        actions: {
            index: {
                method: 'GET',
                route: '',
                data: false
            },
            store: {
                method: 'POST',
                route: '',
            },
            fetch: {
                method: 'GET',
                route: '{id}',
                apply: true,
                data: false
            },
            update: {
                method: 'PUT',
                route: '{id}',
                apply: true,
            },
            destroy: {
                method: 'DELETE',
                route: '{id}',
                data: false
            }
        },
    },

};