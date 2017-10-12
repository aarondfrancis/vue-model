var _ = require('lodash');
var Vue = require('vue');

module.exports = function (obj, path, value) {
    var parts = _.toPath(path);
    var key = _.last(parts);

    value = _.set({}, parts, value);

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        value = _.get(value, part);

        if (_.has(obj, part) && part !== _.last(parts)) {
            obj = obj[part];
            continue;
        }

        key = part;
        break;
    }

    return Vue.set(obj, key, value);
}

// var test = [{
//     base: {
//         something: ['a', 'b', 'c']
//     },
//     value: 1,
//     path: 'something[0]',
//     expects: {
//         something: [1, 'b', 'c']
//     }
// }, {
//     base: {
//         top: {},
//     },
//     value: 'set',
//     path: 'top',
//     expects: {
//         top: 'set'
//     }
// }, {
//     base: {
//         top: {},
//     },
//     value: 'set',
//     path: 'top.foo.bar',
//     expects: {
//         top: {
//             foo: {
//                 bar: 'set'
//             }
//         }
//     }
// }, {
//     base: {
//         top: {
//             foo: {
//                 bar: {}
//             }
//         },
//     },
//     value: 'set',
//     path: 'top.foo.bar',
//     expects: {
//         top: {
//             foo: {
//                 bar: 'set'
//             }
//         }
//     }
// }, {
//     base: ['a', 'b', 'c'],
//     value: 'set',
//     path: '0',
//     expects: ['set', 'b', 'c']
// }];
//
// for (var i = 0; i < test.length; i++) {
//     console.log('----------------');
//     var testcase = test[i];
//     nestSet(testcase.base, testcase.path, testcase.value);
//     console.log(_.isMatch(testcase.base, testcase.expects))
// }
