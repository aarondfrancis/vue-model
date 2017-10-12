// Waiting for a new release that includes: https://github.com/konsumer/emitonoff/pull/3

var EmitOnOff = module.exports = function (thing) {
    if (!thing) thing = {};

    thing._subs = [];
    thing._paused = false;
    thing._pending = [];

    /**
     * Sub of pubsub
     * @param  {String}   name name of event
     * @param  {Function} cb   your callback
     */
    thing.on = function (name, cb) {
        thing._subs[name] = thing._subs[name] || [];
        thing._subs[name].push(cb);
    };

    /**
     * remove sub of pubsub
     * @param  {String}   name name of event
     * @param  {Function} cb   your callback
     */
    thing.off = function (name, cb) {
        if (!thing._subs[name]) return;
        for (var i in thing._subs[name]) {
            if (thing._subs[name][i] === cb) {
                thing._subs[name].splice(i, 1);
                break;
            }
        }
    };

    /**
     * Pub of pubsub
     * @param  {String}   name name of event
     * @param  {Mixed}    data the data to publish
     */
    thing.emit = function (name) {
        if (!thing._subs[name]) return;

        var args = Array.prototype.slice.call(arguments, 1);

        if (thing._paused) {
            thing._pending[name] = thing._pending[name] || [];
            thing._pending[name].push(args)
            return
        }

        for (var i in thing._subs[name]) {
            thing._subs[name][i].apply(thing, args);
        }
    };

    thing.pause = function () {
        thing._paused = true;
    };

    thing.resume = function () {
        thing._paused = false;

        for (var name in thing._pending) {
            for (var i = 0; i < thing._pending[name].length; i++) {
                thing.emit(name, thing._pending[name][i])
            }
        }
    };

    return thing;
};