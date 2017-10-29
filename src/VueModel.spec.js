const _ = require('lodash');
const Vue = require("vue");
const VueModel = require('./VueModel');

describe("VueModel", () => {

    // This is need because Vue.use caches installed plugins
    var fakeVueUse = (plugin, ...args) => {
        plugin.install.apply(plugin, [Vue].concat(args));
    };

    describe("Vue.models.register() should", () => {
        beforeEach(() => {
            VueModel.registry = {};
            spyOn(VueModel, 'register').and.callThrough();
        });

        it("register model(s)", () => {
            expect(VueModel.register).not.toHaveBeenCalled();

            fakeVueUse(VueModel);

            const baseRoute = '/test'

            Vue.models.register('users', {
                http: {
                    baseRoute
                }
            });

            expect(VueModel.register).toHaveBeenCalled();
            expect(VueModel.registry.users).toBeTruthy();
            expect(_.get(VueModel.registry.users, 'http.baseRoute')).toBe(baseRoute);
        });

        it("register model(s) when Vue.use(VueModel, options) is called", () => {
            expect(VueModel.register).not.toHaveBeenCalled();
            const baseRoute = '/test2'

            fakeVueUse(VueModel, {
                users: {
                    http: {
                        baseRoute
                    }
                }
            });

            expect(VueModel.register).toHaveBeenCalled();
            expect(VueModel.registry.users).toBeTruthy();
            expect(_.get(VueModel.registry.users, 'http.baseRoute')).toBe(baseRoute);
        });
    });
});