const Vue = require("vue");

describe("VueModel", () => {
    describe("Vue.models.register() should", () => {

        it("register model(s)", () => {
            const VueModel = require('./VueModel');
            Vue.use(VueModel);

            Vue.models.register('users', {
                http: {
                    baseRoute: '/users',
                },
            });
        });

        it("register model(s) when Vue.use(VueModel, options) is called", () => {
            const VueModel = require('./VueModel');
            Vue.use(VueModel, {
                users: {
                    http: {
                        baseRoute: '/users',
                    }
                }
            });
        });
    });
});