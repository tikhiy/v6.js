(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
var type = require('./type');
var lastRes = 'undefined', lastVal;
module.exports = function _type(val) {
    if (val === lastVal) {
        return lastRes;
    }
    return lastRes = type(lastVal = val);
};
},{"./type":60}],2:[function(require,module,exports){
'use strict';
var isset = require('../isset');
var undefined;
var defineGetter = Object.prototype.__defineGetter__, defineSetter = Object.prototype.__defineSetter__;
function baseDefineProperty(object, key, descriptor) {
    var hasGetter = isset('get', descriptor), hasSetter = isset('set', descriptor), get, set;
    if (hasGetter || hasSetter) {
        if (hasGetter && typeof (get = descriptor.get) !== 'function') {
            throw TypeError('Getter must be a function: ' + get);
        }
        if (hasSetter && typeof (set = descriptor.set) !== 'function') {
            throw TypeError('Setter must be a function: ' + set);
        }
        if (isset('writable', descriptor)) {
            throw TypeError('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
        }
        if (defineGetter) {
            if (hasGetter) {
                defineGetter.call(object, key, get);
            }
            if (hasSetter) {
                defineSetter.call(object, key, set);
            }
        } else {
            throw Error('Cannot define getter or setter');
        }
    } else if (isset('value', descriptor)) {
        object[key] = descriptor.value;
    } else if (!isset(key, object)) {
        object[key] = undefined;
    }
    return object;
}
module.exports = baseDefineProperty;
},{"../isset":43}],3:[function(require,module,exports){
'use strict';
module.exports = function baseExec(regexp, string) {
    var result = [], value;
    regexp.lastIndex = 0;
    while (value = regexp.exec(string)) {
        result.push(value);
    }
    return result;
};
},{}],4:[function(require,module,exports){
'use strict';
var callIteratee = require('../call-iteratee'), isset = require('../isset');
module.exports = function baseForEach(arr, fn, ctx, fromRight) {
    var i, j, idx;
    for (i = -1, j = arr.length - 1; j >= 0; --j) {
        if (fromRight) {
            idx = j;
        } else {
            idx = ++i;
        }
        if (isset(idx, arr) && callIteratee(fn, ctx, arr[idx], idx, arr) === false) {
            break;
        }
    }
    return arr;
};
},{"../call-iteratee":13,"../isset":43}],5:[function(require,module,exports){
'use strict';
var callIteratee = require('../call-iteratee');
module.exports = function baseForIn(obj, fn, ctx, fromRight, keys) {
    var i, j, key;
    for (i = -1, j = keys.length - 1; j >= 0; --j) {
        if (fromRight) {
            key = keys[j];
        } else {
            key = keys[++i];
        }
        if (callIteratee(fn, ctx, obj[key], key, obj) === false) {
            break;
        }
    }
    return obj;
};
},{"../call-iteratee":13}],6:[function(require,module,exports){
'use strict';
var isset = require('../isset');
module.exports = function baseGet(obj, path, off) {
    var l = path.length - off, i = 0, key;
    for (; i < l; ++i) {
        key = path[i];
        if (isset(key, obj)) {
            obj = obj[key];
        } else {
            return;
        }
    }
    return obj;
};
},{"../isset":43}],7:[function(require,module,exports){
'use strict';
var baseToIndex = require('./base-to-index');
var indexOf = Array.prototype.indexOf, lastIndexOf = Array.prototype.lastIndexOf;
function baseIndexOf(arr, search, fromIndex, fromRight) {
    var l, i, j, idx, val;
    if (search === search && (idx = fromRight ? lastIndexOf : indexOf)) {
        return idx.call(arr, search, fromIndex);
    }
    l = arr.length;
    if (!l) {
        return -1;
    }
    j = l - 1;
    if (typeof fromIndex !== 'undefined') {
        fromIndex = baseToIndex(fromIndex, l);
        if (fromRight) {
            j = Math.min(j, fromIndex);
        } else {
            j = Math.max(0, fromIndex);
        }
        i = j - 1;
    } else {
        i = -1;
    }
    for (; j >= 0; --j) {
        if (fromRight) {
            idx = j;
        } else {
            idx = ++i;
        }
        val = arr[idx];
        if (val === search || search !== search && val !== val) {
            return idx;
        }
    }
    return -1;
}
module.exports = baseIndexOf;
},{"./base-to-index":10}],8:[function(require,module,exports){
'use strict';
var baseIndexOf = require('./base-index-of');
var support = require('../support/support-keys');
var hasOwnProperty = Object.prototype.hasOwnProperty;
var k, fixKeys;
if (support === 'not-supported') {
    k = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
    ];
    fixKeys = function fixKeys(keys, object) {
        var i, key;
        for (i = k.length - 1; i >= 0; --i) {
            if (baseIndexOf(keys, key = k[i]) < 0 && hasOwnProperty.call(object, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
}
module.exports = function baseKeys(object) {
    var keys = [];
    var key;
    for (key in object) {
        if (hasOwnProperty.call(object, key)) {
            keys.push(key);
        }
    }
    if (support !== 'not-supported') {
        return keys;
    }
    return fixKeys(keys, object);
};
},{"../support/support-keys":54,"./base-index-of":7}],9:[function(require,module,exports){
'use strict';
var get = require('./base-get');
module.exports = function baseProperty(object, path) {
    if (object != null) {
        if (path.length > 1) {
            return get(object, path, 0);
        }
        return object[path[0]];
    }
};
},{"./base-get":6}],10:[function(require,module,exports){
'use strict';
module.exports = function baseToIndex(v, l) {
    if (!l || !v) {
        return 0;
    }
    if (v < 0) {
        v += l;
    }
    return v || 0;
};
},{}],11:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR, defaultTo = require('./default-to');
module.exports = function before(n, fn) {
    var value;
    if (typeof fn !== 'function') {
        throw TypeError(ERR.FUNCTION_EXPECTED);
    }
    n = defaultTo(n, 1);
    return function () {
        if (--n >= 0) {
            value = fn.apply(this, arguments);
        }
        return value;
    };
};
},{"./constants":17,"./default-to":24}],12:[function(require,module,exports){
'use strict';
var constants = require('./constants');
var indexOf = require('./index-of');
var _bind = Function.prototype.bind || function bind(c) {
        var f = this;
        var a;
        if (arguments.length <= 2) {
            return function bound() {
                return f.apply(c, arguments);
            };
        }
        a = Array.prototype.slice.call(arguments, 1);
        return function bound() {
            return f.apply(c, a.concat(Array.prototype.slice.call(arguments)));
        };
    };
function process(p, a) {
    var r = [];
    var j = -1;
    var i, l;
    for (i = 0, l = p.length; i < l; ++i) {
        if (p[i] === constants.PLACEHOLDER) {
            r.push(a[++j]);
        } else {
            r.push(p[i]);
        }
    }
    for (l = a.length; j < l; ++j) {
        r.push(a[i]);
    }
    return r;
}
module.exports = function bind(f, c) {
    var p;
    if (typeof f !== 'function') {
        throw TypeError(constants.ERR.FUNCTION_EXPECTED);
    }
    if (arguments.length <= 2) {
        return _bind.call(f, c);
    }
    p = Array.prototype.slice.call(arguments, 2);
    if (indexOf(p, constants.PLACEHOLDER) < 0) {
        return Function.prototype.call.apply(_bind, arguments);
    }
    return function bound() {
        return f.apply(c, process(p, arguments));
    };
};
},{"./constants":17,"./index-of":31}],13:[function(require,module,exports){
'use strict';
module.exports = function callIteratee(fn, ctx, val, key, obj) {
    if (typeof ctx === 'undefined') {
        return fn(val, key, obj);
    }
    return fn.call(ctx, val, key, obj);
};
},{}],14:[function(require,module,exports){
'use strict';
var baseExec = require('./base/base-exec'), unescape = require('./unescape'), isKey = require('./is-key'), toKey = require('./to-key'), _type = require('./_type');
var rProperty = /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi;
function stringToPath(str) {
    var path = baseExec(rProperty, str), i = path.length - 1, val;
    for (; i >= 0; --i) {
        val = path[i];
        if (val[2]) {
            path[i] = val[2];
        } else if (val[5] !== null) {
            path[i] = unescape(val[5]);
        } else {
            path[i] = val[3];
        }
    }
    return path;
}
function castPath(val) {
    var path, l, i;
    if (isKey(val)) {
        return [toKey(val)];
    }
    if (_type(val) === 'array') {
        path = Array(l = val.length);
        for (i = l - 1; i >= 0; --i) {
            path[i] = toKey(val[i]);
        }
    } else {
        path = stringToPath('' + val);
    }
    return path;
}
module.exports = castPath;
},{"./_type":1,"./base/base-exec":3,"./is-key":35,"./to-key":57,"./unescape":61}],15:[function(require,module,exports){
'use strict';
module.exports = function clamp(value, lower, upper) {
    if (value >= upper) {
        return upper;
    }
    if (value <= lower) {
        return lower;
    }
    return value;
};
},{}],16:[function(require,module,exports){
'use strict';
var create = require('./create'), getPrototypeOf = require('./get-prototype-of'), toObject = require('./to-object'), each = require('./each'), isObjectLike = require('./is-object-like');
module.exports = function clone(deep, target, guard) {
    var cln;
    if (typeof target === 'undefined' || guard) {
        target = deep;
        deep = true;
    }
    cln = create(getPrototypeOf(target = toObject(target)));
    each(target, function (value, key, target) {
        if (value === target) {
            this[key] = this;
        } else if (deep && isObjectLike(value)) {
            this[key] = clone(deep, value);
        } else {
            this[key] = value;
        }
    }, cln);
    return cln;
};
},{"./create":18,"./each":27,"./get-prototype-of":30,"./is-object-like":37,"./to-object":58}],17:[function(require,module,exports){
'use strict';
module.exports = {
    ERR: {
        INVALID_ARGS: 'Invalid arguments',
        FUNCTION_EXPECTED: 'Expected a function',
        STRING_EXPECTED: 'Expected a string',
        UNDEFINED_OR_NULL: 'Cannot convert undefined or null to object',
        REDUCE_OF_EMPTY_ARRAY: 'Reduce of empty array with no initial value',
        NO_PATH: 'No path was given'
    },
    MAX_ARRAY_LENGTH: 4294967295,
    MAX_SAFE_INT: 9007199254740991,
    MIN_SAFE_INT: -9007199254740991,
    DEEP: 1,
    DEEP_KEEP_FN: 2
};
},{}],18:[function(require,module,exports){
'use strict';
var defineProperties = require('./define-properties');
var setPrototypeOf = require('./set-prototype-of');
var isPrimitive = require('./is-primitive');
function C() {
}
module.exports = Object.create || function create(prototype, descriptors) {
    var object;
    if (prototype !== null && isPrimitive(prototype)) {
        throw TypeError('Object prototype may only be an Object or null: ' + prototype);
    }
    C.prototype = prototype;
    object = new C();
    C.prototype = null;
    if (prototype === null) {
        setPrototypeOf(object, null);
    }
    if (arguments.length >= 2) {
        defineProperties(object, descriptors);
    }
    return object;
};
},{"./define-properties":26,"./is-primitive":40,"./set-prototype-of":52}],19:[function(require,module,exports){
'use strict';
var baseForEach = require('../base/base-for-each'), baseForIn = require('../base/base-for-in'), isArrayLike = require('../is-array-like'), toObject = require('../to-object'), iteratee = require('../iteratee').iteratee, keys = require('../keys');
module.exports = function createEach(fromRight) {
    return function each(obj, fn, ctx) {
        obj = toObject(obj);
        fn = iteratee(fn);
        if (isArrayLike(obj)) {
            return baseForEach(obj, fn, ctx, fromRight);
        }
        return baseForIn(obj, fn, ctx, fromRight, keys(obj));
    };
};
},{"../base/base-for-each":4,"../base/base-for-in":5,"../is-array-like":33,"../iteratee":44,"../keys":45,"../to-object":58}],20:[function(require,module,exports){
'use strict';
module.exports = function createGetElementDimension(name) {
    return function (e) {
        var v, b, d;
        if (e.window === e) {
            v = Math.max(e['inner' + name] || 0, e.document.documentElement['client' + name]);
        } else if (e.nodeType === 9) {
            b = e.body;
            d = e.documentElement;
            v = Math.max(b['scroll' + name], d['scroll' + name], b['offset' + name], d['offset' + name], b['client' + name], d['client' + name]);
        } else {
            v = e['client' + name];
        }
        return v;
    };
};
},{}],21:[function(require,module,exports){
'use strict';
var baseIndexOf = require('../base/base-index-of'), toObject = require('../to-object');
module.exports = function createIndexOf(fromRight) {
    return function indexOf(arr, search, fromIndex) {
        return baseIndexOf(toObject(arr), search, fromIndex, fromRight);
    };
};
},{"../base/base-index-of":7,"../to-object":58}],22:[function(require,module,exports){
'use strict';
var castPath = require('../cast-path'), noop = require('../noop');
module.exports = function createProperty(baseProperty, useArgs) {
    return function (path) {
        var args;
        if (!(path = castPath(path)).length) {
            return noop;
        }
        if (useArgs) {
            args = Array.prototype.slice.call(arguments, 1);
        }
        return function (object) {
            return baseProperty(object, path, args);
        };
    };
};
},{"../cast-path":14,"../noop":48}],23:[function(require,module,exports){
'use strict';
var ERR = require('../constants').ERR;
module.exports = function createTrim(regexp) {
    return function trim(string) {
        if (string == null) {
            throw TypeError(ERR.UNDEFINED_OR_NULL);
        }
        return ('' + string).replace(regexp, '');
    };
};
},{"../constants":17}],24:[function(require,module,exports){
'use strict';
module.exports = function defaultTo(value, defaultValue) {
    if (value != null && value === value) {
        return value;
    }
    return defaultValue;
};
},{}],25:[function(require,module,exports){
'use strict';
var mixin = require('./mixin'), clone = require('./clone');
module.exports = function defaults(defaults, object) {
    if (object == null) {
        return clone(true, defaults);
    }
    return mixin(true, clone(true, defaults), object);
};
},{"./clone":16,"./mixin":47}],26:[function(require,module,exports){
'use strict';
var support = require('./support/support-define-property');
var defineProperties, baseDefineProperty, isPrimitive, each;
if (support !== 'full') {
    isPrimitive = require('./is-primitive');
    each = require('./each');
    baseDefineProperty = require('./base/base-define-property');
    defineProperties = function defineProperties(object, descriptors) {
        if (support !== 'not-supported') {
            try {
                return Object.defineProperties(object, descriptors);
            } catch (e) {
            }
        }
        if (isPrimitive(object)) {
            throw TypeError('defineProperties called on non-object');
        }
        if (isPrimitive(descriptors)) {
            throw TypeError('Property description must be an object: ' + descriptors);
        }
        each(descriptors, function (descriptor, key) {
            if (isPrimitive(descriptor)) {
                throw TypeError('Property description must be an object: ' + descriptor);
            }
            baseDefineProperty(this, key, descriptor);
        }, object);
        return object;
    };
} else {
    defineProperties = Object.defineProperties;
}
module.exports = defineProperties;
},{"./base/base-define-property":2,"./each":27,"./is-primitive":40,"./support/support-define-property":53}],27:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-each')();
},{"./create/create-each":19}],28:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Height');
},{"./create/create-get-element-dimension":20}],29:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Width');
},{"./create/create-get-element-dimension":20}],30:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR;
var toString = Object.prototype.toString;
module.exports = Object.getPrototypeOf || function getPrototypeOf(obj) {
    var prototype;
    if (obj == null) {
        throw TypeError(ERR.UNDEFINED_OR_NULL);
    }
    prototype = obj.__proto__;
    if (typeof prototype !== 'undefined') {
        return prototype;
    }
    if (toString.call(obj.constructor) === '[object Function]') {
        return obj.constructor.prototype;
    }
    return obj;
};
},{"./constants":17}],31:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-index-of')();
},{"./create/create-index-of":21}],32:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length'), isWindowLike = require('./is-window-like');
module.exports = function isArrayLikeObject(value) {
    return isObjectLike(value) && isLength(value.length) && !isWindowLike(value);
};
},{"./is-length":36,"./is-object-like":37,"./is-window-like":42}],33:[function(require,module,exports){
'use strict';
var isLength = require('./is-length'), isWindowLike = require('./is-window-like');
module.exports = function isArrayLike(value) {
    if (value == null) {
        return false;
    }
    if (typeof value === 'object') {
        return isLength(value.length) && !isWindowLike(value);
    }
    return typeof value === 'string';
};
},{"./is-length":36,"./is-window-like":42}],34:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length');
var toString = {}.toString;
module.exports = Array.isArray || function isArray(value) {
    return isObjectLike(value) && isLength(value.length) && toString.call(value) === '[object Array]';
};
},{"./is-length":36,"./is-object-like":37}],35:[function(require,module,exports){
'use strict';
var _type = require('./_type');
var rDeepKey = /(^|[^\\])(\\\\)*(\.|\[)/;
function isKey(val) {
    var type;
    if (!val) {
        return true;
    }
    if (_type(val) === 'array') {
        return false;
    }
    type = typeof val;
    if (type === 'number' || type === 'boolean' || _type(val) === 'symbol') {
        return true;
    }
    return !rDeepKey.test(val);
}
module.exports = isKey;
},{"./_type":1}],36:[function(require,module,exports){
'use strict';
var MAX_ARRAY_LENGTH = require('./constants').MAX_ARRAY_LENGTH;
module.exports = function isLength(value) {
    return typeof value === 'number' && value >= 0 && value <= MAX_ARRAY_LENGTH && value % 1 === 0;
};
},{"./constants":17}],37:[function(require,module,exports){
'use strict';
module.exports = function isObjectLike(value) {
    return !!value && typeof value === 'object';
};
},{}],38:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
var toString = {}.toString;
module.exports = function isObject(value) {
    return isObjectLike(value) && toString.call(value) === '[object Object]';
};
},{"./is-object-like":37}],39:[function(require,module,exports){
'use strict';
var getPrototypeOf = require('./get-prototype-of');
var isObject = require('./is-object');
var hasOwnProperty = Object.prototype.hasOwnProperty;
var toString = Function.prototype.toString;
var OBJECT = toString.call(Object);
module.exports = function isPlainObject(v) {
    var p, c;
    if (!isObject(v)) {
        return false;
    }
    p = getPrototypeOf(v);
    if (p === null) {
        return true;
    }
    if (!hasOwnProperty.call(p, 'constructor')) {
        return false;
    }
    c = p.constructor;
    return typeof c === 'function' && toString.call(c) === OBJECT;
};
},{"./get-prototype-of":30,"./is-object":38}],40:[function(require,module,exports){
'use strict';
module.exports = function isPrimitive(value) {
    return !value || typeof value !== 'object' && typeof value !== 'function';
};
},{}],41:[function(require,module,exports){
'use strict';
var type = require('./type');
module.exports = function isSymbol(value) {
    return type(value) === 'symbol';
};
},{"./type":60}],42:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
module.exports = function isWindowLike(value) {
    return isObjectLike(value) && value.window === value;
};
},{"./is-object-like":37}],43:[function(require,module,exports){
'use strict';
module.exports = function isset(key, obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[key] !== 'undefined' || key in obj;
};
},{}],44:[function(require,module,exports){
'use strict';
var isArrayLikeObject = require('./is-array-like-object'), matchesProperty = require('./matches-property'), property = require('./property');
exports.iteratee = function iteratee(value) {
    if (typeof value === 'function') {
        return value;
    }
    if (isArrayLikeObject(value)) {
        return matchesProperty(value);
    }
    return property(value);
};
},{"./is-array-like-object":32,"./matches-property":46,"./property":51}],45:[function(require,module,exports){
'use strict';
var baseKeys = require('./base/base-keys');
var toObject = require('./to-object');
var support = require('./support/support-keys');
var keys;
if (support !== 'es2015') {
    keys = function keys(v) {
        return baseKeys(toObject(v));
    };
} else {
    keys = Object.keys;
}
module.exports = keys;
},{"./base/base-keys":8,"./support/support-keys":54,"./to-object":58}],46:[function(require,module,exports){
'use strict';
var castPath = require('./cast-path'), get = require('./base/base-get'), ERR = require('./constants').ERR;
module.exports = function matchesProperty(property) {
    var path = castPath(property[0]), value = property[1];
    if (!path.length) {
        throw Error(ERR.NO_PATH);
    }
    return function (object) {
        if (object == null) {
            return false;
        }
        if (path.length > 1) {
            return get(object, path, 0) === value;
        }
        return object[path[0]] === value;
    };
};
},{"./base/base-get":6,"./cast-path":14,"./constants":17}],47:[function(require,module,exports){
'use strict';
var isPlainObject = require('./is-plain-object');
var toObject = require('./to-object');
var isArray = require('./is-array');
var keys = require('./keys');
module.exports = function mixin(deep, object) {
    var l = arguments.length;
    var i = 2;
    var names, exp, j, k, val, key, nowArray, src;
    if (typeof deep !== 'boolean') {
        object = deep;
        deep = true;
        i = 1;
    }
    if (i === l) {
        object = this;
        --i;
    }
    object = toObject(object);
    for (; i < l; ++i) {
        names = keys(exp = toObject(arguments[i]));
        for (j = 0, k = names.length; j < k; ++j) {
            val = exp[key = names[j]];
            if (deep && val !== exp && (isPlainObject(val) || (nowArray = isArray(val)))) {
                src = object[key];
                if (nowArray) {
                    if (!isArray(src)) {
                        src = [];
                    }
                    nowArray = false;
                } else if (!isPlainObject(src)) {
                    src = {};
                }
                object[key] = mixin(true, src, val);
            } else {
                object[key] = val;
            }
        }
    }
    return object;
};
},{"./is-array":34,"./is-plain-object":39,"./keys":45,"./to-object":58}],48:[function(require,module,exports){
'use strict';
module.exports = function noop() {
};
},{}],49:[function(require,module,exports){
'use strict';
module.exports = Date.now || function now() {
    return new Date().getTime();
};
},{}],50:[function(require,module,exports){
'use strict';
var before = require('./before');
module.exports = function once(target) {
    return before(1, target);
};
},{"./before":11}],51:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-property')(require('./base/base-property'));
},{"./base/base-property":9,"./create/create-property":22}],52:[function(require,module,exports){
'use strict';
var isPrimitive = require('./is-primitive'), ERR = require('./constants').ERR;
module.exports = Object.setPrototypeOf || function setPrototypeOf(target, prototype) {
    if (target == null) {
        throw TypeError(ERR.UNDEFINED_OR_NULL);
    }
    if (prototype !== null && isPrimitive(prototype)) {
        throw TypeError('Object prototype may only be an Object or null: ' + prototype);
    }
    if ('__proto__' in target) {
        target.__proto__ = prototype;
    }
    return target;
};
},{"./constants":17,"./is-primitive":40}],53:[function(require,module,exports){
'use strict';
var support;
function test(target) {
    try {
        if ('' in Object.defineProperty(target, '', {})) {
            return true;
        }
    } catch (e) {
    }
    return false;
}
if (test({})) {
    support = 'full';
} else if (typeof document !== 'undefined' && test(document.createElement('span'))) {
    support = 'dom';
} else {
    support = 'not-supported';
}
module.exports = support;
},{}],54:[function(require,module,exports){
'use strict';
var support;
if (Object.keys) {
    try {
        support = Object.keys(''), 'es2015';
    } catch (e) {
        support = 'es5';
    }
} else if ({ toString: null }.propertyIsEnumerable('toString')) {
    support = 'not-supported';
} else {
    support = 'has-a-bug';
}
module.exports = support;
},{}],55:[function(require,module,exports){
'use strict';
var timestamp = require('./timestamp');
var requestAF, cancelAF;
if (typeof window !== 'undefined') {
    cancelAF = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame;
    requestAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
}
var noRequestAnimationFrame = !requestAF || !cancelAF || typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test(navigator.userAgent);
if (noRequestAnimationFrame) {
    var lastRequestTime = 0, frameDuration = 1000 / 60;
    exports.request = function request(animate) {
        var now = timestamp(), nextRequestTime = Math.max(lastRequestTime + frameDuration, now);
        return setTimeout(function () {
            lastRequestTime = nextRequestTime;
            animate(now);
        }, nextRequestTime - now);
    };
    exports.cancel = clearTimeout;
} else {
    exports.request = function request(animate) {
        return requestAF(animate);
    };
    exports.cancel = function cancel(id) {
        return cancelAF(id);
    };
}
},{"./timestamp":56}],56:[function(require,module,exports){
'use strict';
var getTime = require('./now');
var timestamp, navigatorStart;
if (typeof perfomance === 'undefined' || !perfomance.now) {
    navigatorStart = getTime();
    timestamp = function timestamp() {
        return getTime() - navigatorStart;
    };
} else {
    timestamp = perfomance.now;
}
module.exports = timestamp;
},{"./now":49}],57:[function(require,module,exports){
'use strict';
var unescape = require('./unescape'), isSymbol = require('./is-symbol');
module.exports = function toKey(val) {
    var key;
    if (typeof val === 'string') {
        return unescape(val);
    }
    if (isSymbol(val)) {
        return val;
    }
    key = '' + val;
    if (key === '0' && 1 / val === -Infinity) {
        return '-0';
    }
    return unescape(key);
};
},{"./is-symbol":41,"./unescape":61}],58:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR;
module.exports = function toObject(value) {
    if (value == null) {
        throw TypeError(ERR.UNDEFINED_OR_NULL);
    }
    return Object(value);
};
},{"./constants":17}],59:[function(require,module,exports){
'use strict';
if (String.prototype.trim) {
    module.exports = require('./bind')(Function.prototype.call, String.prototype.trim);
} else {
    module.exports = require('./create/create-trim')(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/);
}
},{"./bind":12,"./create/create-trim":23}],60:[function(require,module,exports){
'use strict';
var create = require('./create');
var toString = {}.toString, types = create(null);
module.exports = function getType(value) {
    var type, tag;
    if (value === null) {
        return 'null';
    }
    type = typeof value;
    if (type !== 'object' && type !== 'function') {
        return type;
    }
    type = types[tag = toString.call(value)];
    if (type) {
        return type;
    }
    return types[tag] = tag.slice(8, -1).toLowerCase();
};
},{"./create":18}],61:[function(require,module,exports){
'use strict';
module.exports = function unescape(string) {
    return string.replace(/\\(\\)?/g, '$1');
};
},{}],62:[function(require,module,exports){
'use strict';
var defaultTo = require('peako/default-to');
var Vector2D = require('./math/Vector2D');
function Camera(options, renderer) {
    if (!options) {
        options = {};
    }
    this.xSpeed = defaultTo(options.xSpeed, 1);
    this.ySpeed = defaultTo(options.ySpeed, 1);
    this.zoomInSpeed = defaultTo(options.zoomInSpeed, 1);
    this.zoomOutSpeed = defaultTo(options.zoomOutSpeed, 1);
    this.zoom = defaultTo(options.zoom, 1);
    this.minZoom = defaultTo(options.minZoom, 1);
    this.maxZoom = defaultTo(options.maxZoom, 1);
    this.useLinearZoomIn = defaultTo(options.useLinearZoomIn, true);
    this.useLinearZoomOut = defaultTo(options.useLinearZoomOut, true);
    this.offset = options.offset;
    if (renderer) {
        if (!this.offset) {
            this.offset = new Vector2D(renderer.w * 0.5, renderer.h * 0.5);
        }
        this.renderer = renderer;
    } else if (!this.offset) {
        this.offset = new Vector2D();
    }
    this.position = [
        0,
        0,
        0,
        0,
        0,
        0
    ];
}
Camera.prototype = {
    update: function update() {
        var pos = this.position;
        if (pos[0] !== pos[2]) {
            pos[0] += (pos[2] - pos[0]) * this.xSpeed;
        }
        if (pos[1] !== pos[3]) {
            pos[1] += (pos[3] - pos[1]) * this.ySpeed;
        }
        return this;
    },
    lookAt: function lookAt(at) {
        var pos = this.position, off = this.offset;
        pos[2] = off.x / this.zoom - (pos[4] = at.x);
        pos[3] = off.y / this.zoom - (pos[5] = at.y);
        return this;
    },
    shouldLookAt: function shouldLookAt() {
        return new Vector2D(this.position[4], this.position[5]);
    },
    looksAt: function looksAt() {
        var x = (this.offset.x - this.position[0] * this.zoom) / this.zoom, y = (this.offset.y - this.position[1] * this.zoom) / this.zoom;
        return new Vector2D(x, y);
    },
    sees: function sees(x, y, w, h, renderer) {
        var off = this.offset, at = this.looksAt();
        if (!renderer) {
            renderer = this.renderer;
        }
        return x + w > at.x - off.x / this.zoom && x < at.x + (renderer.w - off.x) / this.zoom && y + h > at.y - off.y / this.zoom && y < at.y + (renderer.h - off.y) / this.zoom;
    },
    zoomIn: function zoomIn() {
        var spd;
        if (this.zoom !== this.maxZoom) {
            if (this.useLinearZoomIn) {
                spd = this.zoomInSpeed * this.zoom;
            } else {
                spd = this.zoomInSpeed;
            }
            this.zoom = Math.min(this.zoom + spd, this.maxZoom);
        }
    },
    zoomOut: function zoomOut() {
        var spd;
        if (this.zoom !== this.minZoom) {
            if (this.useLinearZoomOut) {
                spd = this.zoomOutSpeed * this.zoom;
            } else {
                spd = this.zoomOutSpeed;
            }
            this.zoom = Math.max(this.zoom - spd, this.minZoom);
        }
    },
    constructor: Camera
};
module.exports = Camera;
},{"./math/Vector2D":91,"peako/default-to":24}],63:[function(require,module,exports){
'use strict';
function CompoundedImage(image, x, y, w, h) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}
CompoundedImage.prototype = {
    get: function get() {
        return this.image.get();
    },
    constructor: CompoundedImage
};
module.exports = CompoundedImage;
},{}],64:[function(require,module,exports){
'use strict';
function Font(style, variant, weight, size, lineHeight, family) {
}
Font.prototype = {
    set: function set(style, variant, weight, size, lineHeight, family) {
        if (style instanceof Font) {
            this.setFont(style);
        } else if (variant == null) {
            if (isGlobal(style) || isFontSize(style)) {
                this.size = style;
            } else {
                this.family = style;
            }
        } else if (weight == null) {
        }
        if (variant == null) {
            if (is_global(style) || is_font_size(style)) {
                this.size = style;
            } else {
                this.family = style;
            }
        } else if (weight === undefined) {
            this.size = style;
            this.family = variant;
        } else if (size === undefined) {
            this[get_property_name(style, 'style')] = style;
            this.size = variant;
            this.family = weight;
        } else if (family === undefined) {
            var a = get_property_name(style, 'style'), b = get_property_name(variant, a === 'style' ? 'variant' : 'weight');
            if (a === b) {
                b = a === 'style' ? 'variant' : 'weight';
            }
            this[a] = style;
            this[b] = variant;
            this.size = weight;
            this.family = size;
        } else {
            this.style = style;
            this.variant = variant;
            this.weight = weight;
            this.size = size;
            this.family = family;
        }
    },
    setFont: function setFont(font) {
        this.style = font.style;
        this.variant = font.variant;
        this.weight = font.weight;
        this.size = font.size;
        this.lineHeight = font.lineHeight;
        this.family = font.family;
        return this;
    },
    constructor: Font
};
function isGlobal(v) {
    return v === 'inherit' || v === 'initial' || v === 'unset';
}
function isFontStyle(v) {
    return v === 'normal' || v === 'italic' || v === 'oblique';
}
function isFontVariant(v) {
    return v === 'none' || v === 'normal' || v === 'small-caps';
}
function isFontSize(v) {
    return typeof v == 'number' || /^(?:smaller|xx-small|x-small|small|medium|large|x-large|xx-large|larger|(\d+|\d*\.\d+)(px|em|\u0025|cm|in|mm|pc|pt|rem)?)$/.test(v);
}
function get(v, k) {
    if (isGlobal(v)) {
        return k;
    }
    if (isFontStyle(v)) {
        return 'style';
    }
    if (isFontVariant(v)) {
        return 'variant';
    }
    return 'weight';
}
module.exports = Font;
},{}],65:[function(require,module,exports){
'use strict';
var CompoundedImage = require('./CompoundedImage');
var report = require('./report');
function Image(url) {
    this.loaded = false;
    this.x = 0;
    this.y = 0;
    if (typeof HTMLImageElement !== 'undefined' && url instanceof HTMLImageElement) {
        if (url.src) {
            if (url.complete) {
                this._onload();
            } else {
                report('new v6.Image: you should manually set the "loaded" property if you are using "new v6.Image( image )"');
            }
            this.url = url.src;
        } else {
            this.url = '';
        }
        this.image = url;
    } else if (typeof url === 'string') {
        this.image = document.createElement('img');
        this.url = url;
        this.load();
    } else {
        throw TypeError('new v6.Image: first argument must be a string or a HTMLImageElement object');
    }
}
Image.prototype = {
    _onload: function _onload(e) {
        if (e) {
            this.image.onload = null;
        }
        this.w = this.image.width;
        this.h = this.image.height;
        this.loaded = true;
    },
    load: function load(url) {
        if (!this.loaded) {
            this.image.onload = this._onload;
            this.image.src = this.url = this.url || url || '';
        }
        return this;
    },
    get: function get() {
        return this;
    },
    constructor: Image
};
Image.stretch = function stretch(image, w, h) {
    var x = h / image.h * image.w;
    if (x < w) {
        h = w / image.w * image.h;
    } else {
        w = x;
    }
    return new CompoundedImage(image.get(), image.x, image.y, w, h);
};
Image.cut = function cut(image, x, y, w, h) {
    x += image.x;
    if (x + w > image.x + image.w) {
        throw Error('v6.Image.cut: cannot cut the image because the new image X or W is out of bounds');
    }
    y += image.y;
    if (y + h > image.y + image.h) {
        throw Error('v6.Image.cut: cannot cut the image because the new image Y or H is out of bounds');
    }
    return new CompoundedImage(image.get(), x, y, w, h);
};
module.exports = Image;
},{"./CompoundedImage":63,"./report":99}],66:[function(require,module,exports){
'use strict';
var getElementW = require('peako/get-element-w'), getElementH = require('peako/get-element-h');
var _setDefaultDrawingSettings = require('./_setDefaultDrawingSettings'), _copyDrawingSettings = require('./_copyDrawingSettings'), _getContextNameGL = require('./_getContextNameGL'), _createPolygon = require('./_createPolygon'), _polygons = require('./_polygons'), CompoundedImage = require('./CompoundedImage'), constants = require('./constants'), options = require('./options'), Image = require('./Image');
var rendererIndex = 0;
function Renderer(options, mode) {
    var getContextOptions = { alpha: options.alpha };
    if (options.canvas) {
        this.canvas = options.canvas;
    } else {
        this.canvas = document.createElement('canvas');
        this.canvas.innerHTML = 'Unable to run the application.';
    }
    if (options.append) {
        this.add();
    }
    if (mode === constants.MODE_2D) {
        this.context = this.canvas.getContext('2d', getContextOptions);
    } else if (mode === constants.MODE_GL) {
        if (mode = _getContextNameGL()) {
            this.context = this.canvas.getContext(mode, getContextOptions);
        } else {
            throw Error('Cannot get WebGL context. Try to use v6.constants.MODE_GL as the renderer mode or v6.Renderer2D instead of v6.RendererGL');
        }
    }
    this.settings = options.settings;
    this.mode = mode;
    this.index = rendererIndex;
    this._stack = [];
    this._stackIndex = -1;
    this._vertices = [];
    _setDefaultDrawingSettings(this, this);
    if ('w' in options || 'h' in options) {
        this.resize(options.w, options.h);
    } else {
        this.resizeTo(window);
    }
    rendererIndex += 1;
}
Renderer.prototype = {
    add: function add(parent) {
        (parent || document.body).appendChild(this.canvas);
        return this;
    },
    destroy: function destroy() {
        this.canvas.parentNode.removeChild(this.canvas);
        return this;
    },
    push: function push() {
        if (this._stack[++this._stackIndex]) {
            _copyDrawingSettings(this._stack[this._stackIndex], this);
        } else {
            this._stack.push(_setDefaultDrawingSettings({}, this));
        }
        return this;
    },
    pop: function pop() {
        if (this._stackIndex >= 0) {
            _copyDrawingSettings(this, this._stack[this._stackIndex--]);
        } else {
            _setDefaultDrawingSettings(this, this);
        }
        return this;
    },
    resize: function resize(w, h) {
        var canvas = this.canvas;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var scale = this.settings.scale;
        canvas.width = this.w = Math.floor(w * scale);
        canvas.height = this.h = Math.floor(h * scale);
        return this;
    },
    resizeTo: function resizeTo(element) {
        return this.resize(getElementW(element), getElementH(element));
    },
    rescale: function rescale() {
        return this.resizeTo(this.canvas);
    },
    background: function background(r, g, b, a) {
        if (r instanceof Image || r instanceof CompoundedImage) {
            return this.backgroundImage(r);
        }
        return this.backgroundColor(r, g, b, a);
    },
    _polygon: function _polygon(x, y, rx, ry, n, a, degrees) {
        var polygon = _polygons[n];
        var matrix = this.matrix;
        if (!polygon) {
            polygon = _polygons[n] = _createPolygon(n);
        }
        if (degrees) {
            a *= Math.PI / 180;
        }
        matrix.save();
        matrix.translate(x, y);
        matrix.rotate(a);
        this.vertices(polygon, polygon.length * 0.5, null, rx, ry);
        matrix.restore();
        return this;
    },
    polygon: function polygon(x, y, r, n, a) {
        if (n % 1) {
            n = Math.floor(n * 100) * 0.01;
        }
        if (typeof a !== 'undefined') {
            this._polygon(x, y, r, r, n, a, options.degrees);
        } else {
            this._polygon(x, y, r, r, n, -Math.PI * 0.5);
        }
        return this;
    },
    constructor: Renderer
};
module.exports = Renderer;
},{"./CompoundedImage":63,"./Image":65,"./_copyDrawingSettings":72,"./_createPolygon":73,"./_getContextNameGL":76,"./_polygons":77,"./_setDefaultDrawingSettings":78,"./constants":87,"./options":95,"peako/get-element-h":28,"peako/get-element-w":29}],67:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults'), constants = require('./constants'), Renderer = require('./Renderer'), o = require('./rendererOptions');
function Renderer2D(options) {
    options = defaults(o, options);
    Renderer.call(this, options, constants.MODE_2D);
    this.smooth(this.settings.smooth);
    this.matrix = this.context;
    this._beginPath = false;
}
Renderer2D.prototype = Object.create(Renderer.prototype);
Renderer2D.prototype.smooth = function () {
    var names = [
            'webkitImageSmoothingEnabled',
            'mozImageSmoothingEnabled',
            'msImageSmoothingEnabled',
            'oImageSmoothingEnabled',
            'imageSmoothingEnabled'
        ];
    return function smooth(bool) {
        var i;
        if (typeof bool !== 'boolean') {
            throw TypeError('First argument in smooth( bool ) must be a boolean');
        }
        for (i = names.length - 1; i >= 0; --i) {
            if (names[i] in this.context) {
                this.context[names[i]] = bool;
            }
        }
        this.settings.smooth = bool;
        return this;
    };
}();
Renderer2D.prototype.backgroundColor = function backgroundColor(r, g, b, a) {
    var context = this.context;
    context.save();
    context.setTransform(this.settings.scale, 0, 0, this.settings.scale, 0, 0);
    context.fillStyle = new this.settings.color(r, g, b, a);
    context.fillRect(0, 0, this.w, this.h);
    context.restore();
    return this;
};
Renderer2D.prototype.backgroundImage = function backgroundImage(image) {
    var _rectAlignX = this._rectAlignX, _rectAlignY = this._rectAlignY;
    this._rectAlignX = 'left';
    this._rectAlignY = 'top';
    this.image(Image.stretch(image, this.w, this.h), 0, 0);
    this._rectAlignX = _rectAlignX;
    this._rectAlignY = _rectAlignY;
    return this;
};
Renderer2D.prototype.clear = function clear(x, y, w, h) {
    if (typeof x === 'undefined') {
        x = y = 0;
        w = this.w;
        h = this.h;
    } else {
        x = Math.floor(align(x, w, this._rectAlignX));
        y = Math.floor(align(y, h, this._rectAlignY));
    }
    this.context.clearRect(x, y, w, h);
    return this;
};
Renderer2D.prototype.vertices = function vertices(verts, count, _mode, _sx, _sy) {
    var context = this.context, i;
    if (count < 2) {
        return this;
    }
    if (_sx == null) {
        _sx = _sy = 1;
    }
    context.beginPath();
    context.moveTo(verts[0] * _sx, verts[1] * _sy);
    for (i = 2, count *= 2; i < count; i += 2) {
        context.lineTo(verts[i] * _sx, verts[i + 1] * _sy);
    }
    if (this._doFill) {
        this._fill();
    }
    if (this._doStroke && this._lineWidth > 0) {
        this._stroke(true);
    }
    return this;
};
Renderer2D.prototype.constructor = Renderer2D;
module.exports = Renderer2D;
},{"./Renderer":66,"./constants":87,"./rendererOptions":98,"peako/defaults":25}],68:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults'), ShaderProgram = require('./ShaderProgram'), Transform = require('./Transform'), constants = require('./constants'), Renderer = require('./Renderer'), shaders = require('./defaultShaders'), o = require('./rendererOptions');
function RendererGL(options) {
    options = defaults(o, options);
    Renderer.call(this, options, constants.MODE_GL);
    this.matrix = new Transform();
    this.buffers = {
        default: this.context.createBuffer(),
        rect: this.context.createBuffer()
    };
    this.shaders = { basic: new ShaderProgram(shaders.basicVert, shaders.basicFrag, this.context) };
    this.blending(options.blending);
}
RendererGL.prototype = Object.create(Renderer.prototype);
RendererGL.prototype.resize = function resize(w, h) {
    Renderer.prototype.resize.call(this, w, h);
    this.context.viewport(0, 0, this.w, this.h);
    return this;
};
RendererGL.prototype.blending = function blending(blending) {
    var gl = this.context;
    if (blending) {
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
    } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }
    return this;
};
RendererGL.prototype._clearColor = function _clearColor(r, g, b, a) {
    var gl = this.context;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
RendererGL.prototype.backgroundColor = function backgroundColor(r, g, b, a) {
    var rgba = new this.settings.color(r, g, b, a).rgba();
    this._clearColor(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]);
    return this;
};
RendererGL.prototype.clear = function clear() {
    this._clearColor(0, 0, 0, 0);
    return this;
};
RendererGL.prototype.vertices = function vertices(verts, count, mode, _sx, _sy) {
    var program = this.shaders.basic, gl = this.context;
    if (count < 2) {
        return this;
    }
    if (verts) {
        if (mode == null) {
            mode = gl.STATIC_DRAW;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.default);
        gl.bufferData(gl.ARRAY_BUFFER, verts, mode);
    }
    if (_sx != null) {
        this.matrix.scale(_sx, _sy);
    }
    program.use().uniform('utransform', this.matrix.matrix).uniform('ures', [
        this.w,
        this.h
    ]).pointer('apos', 2, gl.FLOAT, false, 0, 0);
    if (this._doFill) {
        program.uniform('ucolor', this._fillColor.rgba());
        gl.drawArrays(gl.TRIANGLE_FAN, 0, count);
    }
    if (this._doStroke && this._lineWidth > 0) {
        program.uniform('ucolor', this._strokeColor.rgba());
        gl.lineWidth(this._lineWidth);
        gl.drawArrays(gl.LINE_LOOP, 0, count);
    }
    return this;
};
RendererGL.prototype.constructor = RendererGL;
module.exports = RendererGL;
},{"./Renderer":66,"./ShaderProgram":69,"./Transform":71,"./constants":87,"./defaultShaders":88,"./rendererOptions":98,"peako/defaults":25}],69:[function(require,module,exports){
'use strict';
var _createProgram = require('./_createProgram'), _createShader = require('./_createShader');
function ShaderProgram(vert, frag, gl) {
    if (typeof vert === 'string') {
        vert = _createShader(vert, gl.VERTEX_SHADER, gl);
    }
    if (typeof frag === 'string') {
        frag = _createShader(frag, gl.FRAGMENT_SHADER, gl);
    }
    this._program = _createProgram(vert, frag, gl);
    this._gl = gl;
    this.attributes = attributes(gl, this._program);
    this.uniforms = uniforms(gl, this._program);
}
ShaderProgram.prototype = {
    use: function use() {
        this._gl.useProgram(this._program);
        return this;
    },
    pointer: function pointer(name, size, type, normalized, stride, offset) {
        var location = this.attributes[name].location;
        var _gl = this._gl;
        _gl.enableVertexAttribArray(location);
        _gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        return this;
    },
    constructor: ShaderProgram
};
ShaderProgram.prototype.uniform = function uniform(name, value) {
    var uniform = this.uniforms[name];
    var _gl = this._gl;
    switch (uniform.type) {
    case _gl.BOOL:
    case _gl.INT:
        if (uniform.size > 1) {
            _gl.uniform1iv(uniform.location, value);
        } else {
            _gl.uniform1i(uniform.location, value);
        }
        break;
    case _gl.FLOAT:
        if (uniform.size > 1) {
            _gl.uniform1fv(uniform.location, value);
        } else {
            _gl.uniform1f(uniform.location, value);
        }
        break;
    case _gl.FLOAT_MAT2:
        _gl.uniformMatrix2fv(uniform.location, false, value);
        break;
    case _gl.FLOAT_MAT3:
        _gl.uniformMatrix3fv(uniform.location, false, value);
        break;
    case _gl.FLOAT_MAT4:
        _gl.uniformMatrix4fv(uniform.location, false, value);
        break;
    case _gl.FLOAT_VEC2:
        if (uniform.size > 1) {
            _gl.uniform2fv(uniform.location, value);
        } else {
            _gl.uniform2f(uniform.location, value[0], value[1]);
        }
        break;
    case _gl.FLOAT_VEC3:
        if (uniform.size > 1) {
            _gl.uniform3fv(uniform.location, value);
        } else {
            _gl.uniform3f(uniform.location, value[0], value[1], value[2]);
        }
        break;
    case _gl.FLOAT_VEC4:
        if (uniform.size > 1) {
            _gl.uniform4fv(uniform.location, value);
        } else {
            _gl.uniform4f(uniform.location, value[0], value[1], value[2], value[3]);
        }
        break;
    default:
        throw TypeError('The uniform type is not supported');
    }
    return this;
};
function attributes(gl, program) {
    var i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) - 1;
    var attributes = {};
    var attribute;
    for (; i >= 0; --i) {
        attribute = gl.getActiveAttrib(program, i);
        attribute.location = gl.getAttribLocation(program, attribute.name);
        attributes[attribute.name] = attribute;
    }
    return attributes;
}
function uniforms(gl, program) {
    var i = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) - 1;
    var uniforms = {};
    var uniform, index, info;
    for (; i >= 0; --i) {
        info = gl.getActiveUniform(program, i);
        uniform = {
            location: gl.getUniformLocation(program, info.name),
            size: info.size,
            type: info.type
        };
        if (info.size > 1 && ~(index = info.name.indexOf('[0]'))) {
            uniform.name = info.name.slice(0, index);
        } else {
            uniform.name = info.name;
        }
        uniforms[uniform.name] = uniform;
    }
    return uniforms;
}
module.exports = ShaderProgram;
},{"./_createProgram":74,"./_createShader":75}],70:[function(require,module,exports){
'use strict';
var timestamp = require('peako/timestamp');
var timer = require('peako/timer');
var noop = require('peako/noop');
var constants = require('./constants');
function Ticker(update, render, context) {
    var self = this;
    if (typeof render !== 'function') {
        context = render;
        render = null;
    }
    if (context === constants.SELF_CONTEXT) {
        context = this;
    }
    if (render == null) {
        render = update;
        update = noop;
    }
    this.lastRequestAnimationFrameID = 0;
    this.lastRequestTime = 0;
    this.skippedTime = 0;
    this.totalTime = 0;
    this.running = false;
    this.update = update;
    this.render = render;
    function tick(now) {
        var elapsedTime;
        if (!self.running) {
            if (!now) {
                self.lastRequestAnimationFrameID = timer.request(tick);
                self.lastRequestTime = timestamp();
                self.running = true;
            }
            return this;
        }
        if (!now) {
            now = timestamp();
        }
        elapsedTime = Math.min(1, (now - self.lastRequestTime) * 0.001);
        self.skippedTime += elapsedTime;
        self.totalTime += elapsedTime;
        while (self.skippedTime >= self.step && self.running) {
            self.skippedTime -= self.step;
            if (typeof context !== 'undefined') {
                self.update.call(context, self.step, now);
            } else {
                self.update(self.step, now);
            }
        }
        if (typeof context !== 'undefined') {
            self.render.call(context, elapsedTime, now);
        } else {
            self.render(elapsedTime, now);
        }
        self.lastRequestTime = now;
        self.lastRequestAnimationFrameID = timer.request(tick);
        return this;
    }
    this.tick = tick;
    this.setFPS(60);
}
Ticker.prototype = {
    setFPS: function setFPS(fps) {
        this.step = 1 / fps;
        return this;
    },
    clear: function clear() {
        this.skippedTime = 0;
        return this;
    },
    stop: function stop() {
        this.running = false;
        return this;
    },
    constructor: Ticker
};
module.exports = Ticker;
},{"./constants":87,"peako/noop":48,"peako/timer":55,"peako/timestamp":56}],71:[function(require,module,exports){
'use strict';
var mat3 = require('./mat3');
function Transform() {
    this.matrix = mat3.identity();
    this._index = -1;
    this._stack = [];
}
Transform.prototype = {
    save: function save() {
        if (++this._index < this._stack.length) {
            mat3.copy(this._stack[this._index], this.matrix);
        } else {
            this._stack.push(mat3.clone(this.matrix));
        }
    },
    restore: function restore() {
        if (this._index >= 0) {
            mat3.copy(this.matrix, this._stack[this._index--]);
        } else {
            mat3.setIdentity(this.matrix);
        }
    },
    setTransform: function setTransform(m11, m12, m21, m22, dx, dy) {
        mat3.setTransform(this.matrix, m11, m12, m21, m22, dx, dy);
    },
    translate: function translate(x, y) {
        mat3.translate(this.matrix, x, y);
    },
    rotate: function rotate(angle) {
        mat3.rotate(this.matrix, angle);
    },
    scale: function scale(x, y) {
        mat3.scale(this.matrix, x, y);
    },
    transform: function transform(m11, m12, m21, m22, dx, dy) {
        mat3.transform(this.matrix, m11, m12, m21, m22, dx, dy);
    },
    constructor: Transform
};
module.exports = Transform;
},{"./mat3":90}],72:[function(require,module,exports){
'use strict';
module.exports = function _copyDrawingSettings(obj, src, deep) {
    if (deep) {
        obj._fillColor[0] = src._fillColor[0];
        obj._fillColor[1] = src._fillColor[1];
        obj._fillColor[2] = src._fillColor[2];
        obj._fillColor[3] = src._fillColor[3];
        obj._font.style = src._font.style;
        obj._font.variant = src._font.variant;
        obj._font.weight = src._font.weight;
        obj._font.size = src._font.size;
        obj._font.family = src._font.family;
        obj._strokeColor[0] = src._strokeColor[0];
        obj._strokeColor[1] = src._strokeColor[1];
        obj._strokeColor[2] = src._strokeColor[2];
        obj._strokeColor[3] = src._strokeColor[3];
    }
    obj._rectAlignX = src._rectAlignX;
    obj._rectAlignY = src._rectAlignY;
    obj._doFill = src._doFill;
    obj._doStroke = src._doStroke;
    obj._lineHeight = src._lineHeight;
    obj._lineWidth = src._lineWidth;
    obj._textAlign = src._textAlign;
    obj._textBaseline = src._textBaseline;
    return obj;
};
},{}],73:[function(require,module,exports){
'use strict';
module.exports = function _createPolygon(n) {
    var i = Math.floor(n);
    var verts = new Float32Array(i * 2 + 2);
    var step = Math.PI * 2 / n;
    for (; i >= 0; --i) {
        verts[i * 2] = Math.cos(step * i);
        verts[1 + i * 2] = Math.sin(step * i);
    }
    return verts;
};
},{}],74:[function(require,module,exports){
'use strict';
module.exports = function _createProgram(vert, frag, gl) {
    var program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw Error('Unable to validate the shader program: ' + gl.getProgramInfoLog(program));
    }
    return program;
};
},{}],75:[function(require,module,exports){
'use strict';
module.exports = function _createShader(source, type, gl) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw SyntaxError('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
};
},{}],76:[function(require,module,exports){
'use strict';
var once = require('peako/once');
var _getContextNameGL = once(function () {
        var canvas = document.createElement('canvas');
        var types, i;
        if (typeof canvas.getContext !== 'function') {
            return;
        }
        types = [
            'webkit-3d',
            'moz-webgl',
            'experimental-webgl',
            'webgl'
        ];
        for (i = types.length - 1; i >= 0; --i) {
            if (canvas.getContext(types[i])) {
                return types[i];
            }
        }
    });
module.exports = _getContextNameGL;
},{"peako/once":50}],77:[function(require,module,exports){
'use strict';
},{}],78:[function(require,module,exports){
'use strict';
var _copyDrawingSettings = require('./_copyDrawingSettings');
var Font = require('./Font');
var defaultDrawingSettings = {
        _rectAlignX: 'left',
        _rectAlignY: 'top',
        _textAlign: 'left',
        _textBaseline: 'top',
        _doFill: true,
        _doStroke: true,
        _lineHeight: 14,
        _lineWidth: 2
    };
module.exports = function _setDefaultDrawingSettings(obj, renderer) {
    _copyDrawingSettings(obj, defaultDrawingSettings);
    obj._strokeColor = new renderer.settings.color();
    obj._fillColor = new renderer.settings.color();
    obj._font = new Font();
    return obj;
};
},{"./Font":64,"./_copyDrawingSettings":72}],79:[function(require,module,exports){
'use strict';
var Camera = require('./Camera');
module.exports = function camera(options, renderer) {
    return new Camera(options, renderer);
};
},{"./Camera":62}],80:[function(require,module,exports){
'use strict';
var clamp = require('peako/clamp');
var _parseColor, RGBA;
var undefined;
function HSLA(h, s, l, a) {
    this.set(h, s, l, a);
}
HSLA.prototype = {
    perceivedBrightness: function perceivedBrightness() {
        return this.rgba().perceivedBrightness();
    },
    luminance: function luminance() {
        return this.rgba().luminance();
    },
    brightness: function brightness() {
        return this.rgba().brightness();
    },
    toString: function toString() {
        return 'hsla(' + this[0] + ', ' + this[1] + '%, ' + this[2] + '%, ' + this[3] + ')';
    },
    set: function set(h, s, l, a) {
        switch (true) {
        case typeof h === 'string':
            h = _parseColor(h);
        case typeof h === 'object' && h != null:
            if (h.type !== this.type) {
                h = h[this.type]();
            }
            this[0] = h[0];
            this[1] = h[1];
            this[2] = h[2];
            this[3] = h[3];
            break;
        default:
            switch (undefined) {
            case h:
                a = 1;
                l = s = h = 0;
                break;
            case s:
                a = 1;
                l = Math.floor(h);
                s = h = 0;
                break;
            case l:
                a = s;
                l = Math.floor(h);
                s = h = 0;
                break;
            case a:
                a = 1;
            default:
                h = Math.floor(h);
                s = Math.floor(s);
                l = Math.floor(l);
            }
            this[0] = h;
            this[1] = s;
            this[2] = l;
            this[3] = a;
        }
        return this;
    },
    rgba: function rgba() {
        var rgba = new RGBA();
        var h = this[0] % 360 / 360, s = this[1] * 0.01, l = this[2] * 0.01;
        var tr = h + 1 / 3, tg = h, tb = h - 1 / 3;
        var q;
        if (l < 0.5) {
            q = l * (1 + s);
        } else {
            q = l + s - l * s;
        }
        var p = 2 * l - q;
        if (tr < 0) {
            ++tr;
        }
        if (tg < 0) {
            ++tg;
        }
        if (tb < 0) {
            ++tb;
        }
        if (tr > 1) {
            --tr;
        }
        if (tg > 1) {
            --tg;
        }
        if (tb > 1) {
            --tb;
        }
        rgba[0] = foo(tr, p, q);
        rgba[1] = foo(tg, p, q);
        rgba[2] = foo(tb, p, q);
        rgba[3] = this[3];
        return rgba;
    },
    lerp: function lerp(h, s, l, value) {
        var color = new HSLA();
        color[0] = h;
        color[1] = s;
        color[2] = l;
        return this.lerpColor(color, value);
    },
    lerpColor: function lerpColor(color, value) {
        return this.rgba().lerpColor(color, value).hsla();
    },
    shade: function shade(value) {
        var hsla = new HSLA();
        hsla[0] = this[0];
        hsla[1] = this[1];
        hsla[2] = clamp(this[2] + value, 0, 100);
        hsla[3] = this[3];
        return hsla;
    },
    constructor: HSLA,
    type: 'hsla'
};
function foo(t, p, q) {
    if (t < 1 / 6) {
        return Math.round((p + (q - p) * 6 * t) * 255);
    }
    if (t < 0.5) {
        return Math.round(q * 255);
    }
    if (t < 2 / 3) {
        return Math.round((p + (q - p) * (2 / 3 - t) * 6) * 255);
    }
    return Math.round(p * 255);
}
module.exports = HSLA;
_parseColor = require('./_parseColor');
RGBA = require('./RGBA');
},{"./RGBA":81,"./_parseColor":82,"peako/clamp":15}],81:[function(require,module,exports){
'use strict';
var _parseColor, HSLA;
var undefined;
function RGBA(r, g, b, a) {
    this.set(r, g, b, a);
}
RGBA.prototype = {
    perceivedBrightness: function perceivedBrightness() {
        var r = this[0], g = this[1], b = this[2];
        return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
    },
    luminance: function luminance() {
        return this[0] * 0.2126 + this[1] * 0.7152 + this[2] * 0.0722;
    },
    brightness: function brightness() {
        return 0.299 * this[0] + 0.587 * this[1] + 0.114 * this[2];
    },
    toString: function toString() {
        return 'rgba(' + this[0] + ', ' + this[1] + ', ' + this[2] + ', ' + this[3] + ')';
    },
    set: function set(r, g, b, a) {
        switch (true) {
        case typeof r === 'string':
            r = _parseColor(r);
        case typeof r === 'object' && r != null:
            if (r.type !== this.type) {
                r = r[this.type]();
            }
            this[0] = r[0];
            this[1] = r[1];
            this[2] = r[2];
            this[3] = r[3];
            break;
        default:
            switch (undefined) {
            case r:
                a = 1;
                b = g = r = 0;
                break;
            case g:
                a = 1;
                b = g = r = Math.floor(r);
                break;
            case b:
                a = g;
                b = g = r = Math.floor(r);
                break;
            case a:
                a = 1;
            default:
                r = Math.floor(r);
                g = Math.floor(g);
                b = Math.floor(b);
            }
            this[0] = r;
            this[1] = g;
            this[2] = b;
            this[3] = a;
        }
        return this;
    },
    hsla: function hsla() {
        var hsla = new HSLA();
        var r = this[0] / 255, g = this[1] / 255, b = this[2] / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var l = (max + min) * 50, h, s;
        var diff = max - min;
        if (diff) {
            if (l > 50) {
                s = diff / (2 - max - min);
            } else {
                s = diff / (max + min);
            }
            switch (max) {
            case r:
                if (g < b) {
                    h = 1.0472 * (g - b) / diff + 6.2832;
                } else {
                    h = 1.0472 * (g - b) / diff;
                }
                break;
            case g:
                h = 1.0472 * (b - r) / diff + 2.0944;
                break;
            default:
                h = 1.0472 * (r - g) / diff + 4.1888;
            }
            h = Math.round(h * 360 / 6.2832);
            s = Math.round(s * 100);
        } else {
            h = s = 0;
        }
        hsla[0] = h;
        hsla[1] = s;
        hsla[2] = Math.round(l);
        hsla[3] = this[3];
        return hsla;
    },
    rgba: function rgba() {
        return this;
    },
    lerp: function lerp(r, g, b, value) {
        r = lerp(this[0], r, value);
        g = lerp(this[0], g, value);
        b = lerp(this[0], b, value);
        return new RGBA(r, g, b, this[3]);
    },
    lerpColor: function lerpColor(color, value) {
        var r, g, b;
        if (typeof color !== 'object') {
            color = _parseColor(color);
        }
        if (color.type !== 'rgba') {
            color = color.rgba();
        }
        r = color[0];
        g = color[1];
        b = color[2];
        return this.lerp(r, g, b, value);
    },
    shade: function shade(value) {
        return this.hsla().shade(value).rgba();
    },
    constructor: RGBA,
    type: 'rgba'
};
module.exports = RGBA;
_parseColor = require('./_parseColor');
HSLA = require('./HSLA');
},{"./HSLA":80,"./_parseColor":82}],82:[function(require,module,exports){
'use strict';
var create = require('peako/create');
var trim = require('peako/trim');
var colors = require('./colors');
var RGBA, HSLA;
var parsed = create(null);
var TRANSPARENT = [
        0,
        0,
        0,
        0
    ];
var regexps = {
        hex3: /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/,
        hex: /^#([0-9a-f]{6})([0-9a-f]{2})?$/,
        rgb: /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$|^\s*rgba\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
        hsl: /^hsl\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*\)$|^\s*hsla\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\u0025\s*,\s*(\d+|\d*\.\d+)\s*\)$/
    };
function _parseColor(string) {
    var cache = parsed[string] || parsed[string = trim(string).toLowerCase()];
    if (!cache) {
        if (cache = colors[string]) {
            cache = new ColorData(parseHex(cache), RGBA);
        } else if (cache = regexps.hex.exec(string)) {
            cache = new ColorData(parseHex(formatHex(cache)), RGBA);
        } else if (cache = regexps.rgb.exec(string)) {
            cache = new ColorData(compactMatch(cache), RGBA);
        } else if (cache = regexps.hsl.exec(string)) {
            cache = new ColorData(compactMatch(cache), HSLA);
        } else if (cache = regexps.hex3.exec(string)) {
            cache = new ColorData(parseHex(formatHex(cache, true)), RGBA);
        } else {
            throw SyntaxError(string + ' is not a valid syntax');
        }
        parsed[string] = cache;
    }
    return new cache.color(cache[0], cache[1], cache[2], cache[3]);
}
function formatHex(match, shortSyntax) {
    var r, g, b, a;
    if (!shortSyntax) {
        return match[1] + (match[2] || 'ff');
    }
    r = match[1];
    g = match[2];
    b = match[3];
    a = match[4] || 'f';
    return r + r + g + g + b + b + a + a;
}
function parseHex(hex) {
    if (hex == 0) {
        return TRANSPARENT;
    }
    hex = parseInt(hex, 16);
    return [
        hex >> 24 & 255,
        hex >> 16 & 255,
        hex >> 8 & 255,
        (hex & 255) / 255
    ];
}
function compactMatch(match) {
    if (match[7]) {
        return [
            +match[4],
            +match[5],
            +match[6],
            +match[7]
        ];
    }
    return [
        +match[1],
        +match[2],
        +match[3]
    ];
}
function ColorData(match, color) {
    this[0] = match[0];
    this[1] = match[1];
    this[2] = match[2];
    this[3] = match[3];
    this.color = color;
}
module.exports = _parseColor;
RGBA = require('./RGBA');
HSLA = require('./HSLA');
},{"./HSLA":80,"./RGBA":81,"./colors":84,"peako/create":18,"peako/trim":59}],83:[function(require,module,exports){
'use strict';
var _parseColor = require('./_parseColor');
var RGBA = require('./RGBA');
module.exports = function color(a, b, c, d) {
    if (typeof a !== 'string') {
        return new RGBA(a, b, c, d);
    }
    return _parseColor(a);
};
},{"./RGBA":81,"./_parseColor":82}],84:[function(require,module,exports){
'use strict';
module.exports = {
    aliceblue: 'f0f8ffff',
    antiquewhite: 'faebd7ff',
    aqua: '00ffffff',
    aquamarine: '7fffd4ff',
    azure: 'f0ffffff',
    beige: 'f5f5dcff',
    bisque: 'ffe4c4ff',
    black: '000000ff',
    blanchedalmond: 'ffebcdff',
    blue: '0000ffff',
    blueviolet: '8a2be2ff',
    brown: 'a52a2aff',
    burlywood: 'deb887ff',
    cadetblue: '5f9ea0ff',
    chartreuse: '7fff00ff',
    chocolate: 'd2691eff',
    coral: 'ff7f50ff',
    cornflowerblue: '6495edff',
    cornsilk: 'fff8dcff',
    crimson: 'dc143cff',
    cyan: '00ffffff',
    darkblue: '00008bff',
    darkcyan: '008b8bff',
    darkgoldenrod: 'b8860bff',
    darkgray: 'a9a9a9ff',
    darkgreen: '006400ff',
    darkkhaki: 'bdb76bff',
    darkmagenta: '8b008bff',
    darkolivegreen: '556b2fff',
    darkorange: 'ff8c00ff',
    darkorchid: '9932ccff',
    darkred: '8b0000ff',
    darksalmon: 'e9967aff',
    darkseagreen: '8fbc8fff',
    darkslateblue: '483d8bff',
    darkslategray: '2f4f4fff',
    darkturquoise: '00ced1ff',
    darkviolet: '9400d3ff',
    deeppink: 'ff1493ff',
    deepskyblue: '00bfffff',
    dimgray: '696969ff',
    dodgerblue: '1e90ffff',
    feldspar: 'd19275ff',
    firebrick: 'b22222ff',
    floralwhite: 'fffaf0ff',
    forestgreen: '228b22ff',
    fuchsia: 'ff00ffff',
    gainsboro: 'dcdcdcff',
    ghostwhite: 'f8f8ffff',
    gold: 'ffd700ff',
    goldenrod: 'daa520ff',
    gray: '808080ff',
    green: '008000ff',
    greenyellow: 'adff2fff',
    honeydew: 'f0fff0ff',
    hotpink: 'ff69b4ff',
    indianred: 'cd5c5cff',
    indigo: '4b0082ff',
    ivory: 'fffff0ff',
    khaki: 'f0e68cff',
    lavender: 'e6e6faff',
    lavenderblush: 'fff0f5ff',
    lawngreen: '7cfc00ff',
    lemonchiffon: 'fffacdff',
    lightblue: 'add8e6ff',
    lightcoral: 'f08080ff',
    lightcyan: 'e0ffffff',
    lightgoldenrodyellow: 'fafad2ff',
    lightgrey: 'd3d3d3ff',
    lightgreen: '90ee90ff',
    lightpink: 'ffb6c1ff',
    lightsalmon: 'ffa07aff',
    lightseagreen: '20b2aaff',
    lightskyblue: '87cefaff',
    lightslateblue: '8470ffff',
    lightslategray: '778899ff',
    lightsteelblue: 'b0c4deff',
    lightyellow: 'ffffe0ff',
    lime: '00ff00ff',
    limegreen: '32cd32ff',
    linen: 'faf0e6ff',
    magenta: 'ff00ffff',
    maroon: '800000ff',
    mediumaquamarine: '66cdaaff',
    mediumblue: '0000cdff',
    mediumorchid: 'ba55d3ff',
    mediumpurple: '9370d8ff',
    mediumseagreen: '3cb371ff',
    mediumslateblue: '7b68eeff',
    mediumspringgreen: '00fa9aff',
    mediumturquoise: '48d1ccff',
    mediumvioletred: 'c71585ff',
    midnightblue: '191970ff',
    mintcream: 'f5fffaff',
    mistyrose: 'ffe4e1ff',
    moccasin: 'ffe4b5ff',
    navajowhite: 'ffdeadff',
    navy: '000080ff',
    oldlace: 'fdf5e6ff',
    olive: '808000ff',
    olivedrab: '6b8e23ff',
    orange: 'ffa500ff',
    orangered: 'ff4500ff',
    orchid: 'da70d6ff',
    palegoldenrod: 'eee8aaff',
    palegreen: '98fb98ff',
    paleturquoise: 'afeeeeff',
    palevioletred: 'd87093ff',
    papayawhip: 'ffefd5ff',
    peachpuff: 'ffdab9ff',
    peru: 'cd853fff',
    pink: 'ffc0cbff',
    plum: 'dda0ddff',
    powderblue: 'b0e0e6ff',
    purple: '800080ff',
    red: 'ff0000ff',
    rosybrown: 'bc8f8fff',
    royalblue: '4169e1ff',
    saddlebrown: '8b4513ff',
    salmon: 'fa8072ff',
    sandybrown: 'f4a460ff',
    seagreen: '2e8b57ff',
    seashell: 'fff5eeff',
    sienna: 'a0522dff',
    silver: 'c0c0c0ff',
    skyblue: '87ceebff',
    slateblue: '6a5acdff',
    slategray: '708090ff',
    snow: 'fffafaff',
    springgreen: '00ff7fff',
    steelblue: '4682b4ff',
    tan: 'd2b48cff',
    teal: '008080ff',
    thistle: 'd8bfd8ff',
    tomato: 'ff6347ff',
    turquoise: '40e0d0ff',
    violet: 'ee82eeff',
    violetred: 'd02090ff',
    wheat: 'f5deb3ff',
    white: 'ffffffff',
    whitesmoke: 'f5f5f5ff',
    yellow: 'ffff00ff',
    yellowgreen: '9acd32ff',
    transparent: '00000000'
};
},{}],85:[function(require,module,exports){
'use strict';
var HSLA = require('./HSLA');
module.exports = function hsla(h, s, l, a) {
    return new HSLA(h, s, l, a);
};
},{"./HSLA":80}],86:[function(require,module,exports){
'use strict';
var RGBA = require('./RGBA');
module.exports = function rgba(r, g, b, a) {
    return new RGBA(r, g, b, a);
};
},{"./RGBA":81}],87:[function(require,module,exports){
'use strict';
module.exports = {
    MODE_AUTO: 1,
    MODE_GL: 2,
    MODE_2D: 3,
    RGBA: 4,
    HSLA: 5,
    SELF_CONTEXT: 6
};
},{}],88:[function(require,module,exports){
'use strict';
module.exports = {
    basicVert: 'precision mediump float;attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
    basicFrag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}',
    backgroundVert: 'precision mediump float;attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
    backgroundFrag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
};
},{}],89:[function(require,module,exports){
'use strict';
var Image = require('./Image');
module.exports = function image(url) {
    return new Image(url);
};
},{"./Image":65}],90:[function(require,module,exports){
'use strict';
exports.identity = function identity() {
    return [
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
    ];
};
exports.setIdentity = function setIdentity(m1) {
    m1[0] = m1[4] = m1[8] = 1;
    m1[1] = m1[2] = m1[3] = m1[5] = m1[6] = m1[7] = 0;
};
exports.copy = function copy(m1, m2) {
    m1[0] = m2[0];
    m1[1] = m2[1];
    m1[2] = m2[2];
    m1[3] = m2[3];
    m1[4] = m2[4];
    m1[5] = m2[5];
    m1[6] = m2[6];
    m1[7] = m2[7];
    m1[8] = m2[8];
};
exports.clone = function clone(m1) {
    return [
        m1[0],
        m1[1],
        m1[2],
        m1[3],
        m1[4],
        m1[5],
        m1[6],
        m1[7],
        m1[8]
    ];
};
exports.translate = function translate(m1, x, y) {
    m1[6] = x * m1[0] + y * m1[3] + m1[6];
    m1[7] = x * m1[1] + y * m1[4] + m1[7];
    m1[8] = x * m1[2] + y * m1[5] + m1[8];
};
exports.rotate = function rotate(m1, angle) {
    var m10 = m1[0], m11 = m1[1], m12 = m1[2], m13 = m1[3], m14 = m1[4], m15 = m1[5];
    var x = Math.cos(angle), y = Math.sin(angle);
    m1[0] = x * m10 + y * m13;
    m1[1] = x * m11 + y * m14;
    m1[2] = x * m12 + y * m15;
    m1[3] = x * m13 - y * m10;
    m1[4] = x * m14 - y * m11;
    m1[5] = x * m15 - y * m12;
};
exports.scale = function scale(m1, x, y) {
    m1[0] *= x;
    m1[1] *= x;
    m1[2] *= x;
    m1[3] *= y;
    m1[4] *= y;
    m1[5] *= y;
};
exports.transform = function transform(m1, m11, m12, m21, m22, dx, dy) {
    m1[0] *= m11;
    m1[1] *= m21;
    m1[2] *= dx;
    m1[3] *= m12;
    m1[4] *= m22;
    m1[5] *= dy;
    m1[6] = 0;
    m1[7] = 0;
};
exports.setTransform = function setTransform(m1, m11, m12, m21, m22, dx, dy) {
    m1[0] = m11;
    m1[1] = m12;
    m1[3] = m21;
    m1[4] = m22;
    m1[6] = dx;
    m1[7] = dy;
};
},{}],91:[function(require,module,exports){
'use strict';
var options = require('../options');
function Vector2D(x, y) {
    this.set(x, y);
}
Vector2D.prototype = {
    set: function set(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        return this;
    },
    setVector: function setVector(vector) {
        return this.set(vector.x, vector.y);
    },
    lerp: function (x, y, value) {
        this.x += (x - this.x) * value || 0;
        this.y += (y - this.y) * value || 0;
        return this;
    },
    lerpVector: function lerpVector(vector, value) {
        var x = vector.x || 0, y = vector.y || 0;
        return this.lerp(x, y, value);
    },
    add: function add(x, y) {
        this.x += x || 0;
        this.y += y || 0;
        return this;
    },
    addVector: function addVector(vector) {
        return this.add(vector.x, vector.y);
    },
    sub: function sub(x, y) {
        this.x -= x || 0;
        this.y -= y || 0;
        return this;
    },
    subVector: function subVector(vector) {
        return this.sub(vector.x, vector.y);
    },
    mul: function mul(value) {
        this.x *= value || 0;
        this.y *= value || 0;
        return this;
    },
    mulVector: function mulVector(vector) {
        this.x *= vector.x || 0;
        this.y *= vector.y || 0;
        return this;
    },
    div: function div(value) {
        this.x /= value || 0;
        this.y /= value || 0;
        return this;
    },
    divVector: function divVector(vector) {
        this.x /= vector.x || 0;
        this.y /= vector.y || 0;
        return this;
    },
    angle: function angle() {
        if (options.degrees) {
            return Math.atan2(this.y, this.x) * 180 / Math.PI;
        }
        return Math.atan2(this.y, this.x);
    },
    mag: function mag() {
        return Math.sqrt(this.magSquare());
    },
    magSquare: function magSquare() {
        return this.x * this.x + this.y * this.y;
    },
    setMag: function setMag(value) {
        return this.normalize().mult(value);
    },
    normalize: function normalize() {
        var mag = this.mag();
        if (mag && mag !== 1) {
            this.div(mag);
        }
        return this;
    },
    dot: function dot(x, y) {
        return this.x * (x || 0) + this.y * (y || 0);
    },
    dotVector: function dotVector(vector) {
        return this.x * (vector.x || 0) + this.y * (vector.y || 0);
    },
    clone: function clone() {
        return new Vector2D(this.x, this.y);
    },
    dist: function dist(vector) {
        return dist(this.x, this.y, vector.x, vector.y);
    },
    limit: function limit(value) {
        var mag = this.magSquare();
        if (mag > value * value) {
            this.div(Math.sqrt(mag)).mult(value);
        }
        return this;
    },
    cross: function cross(vector) {
        return Vector2D.cross(this, vector);
    },
    toString: function toString() {
        return 'vec2(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ')';
    },
    rotate: function rotate(angle) {
        var x = this.x, y = this.y;
        var c, s;
        if (options.degrees) {
            angle *= Math.PI / 180;
        }
        c = Math.cos(angle);
        s = Math.sin(angle);
        this.x = x * c - y * s;
        this.y = x * s + y * c;
        return this;
    },
    setAngle: function setAngle(angle) {
        var mag = this.mag();
        if (options.degrees) {
            angle *= Math.PI / 180;
        }
        this.x = mag * Math.cos(angle);
        this.y = mag * Math.sin(angle);
        return this;
    },
    constructor: Vector2D
};
[
    'normalize',
    'setMag',
    'rotate',
    'limit',
    'lerp',
    'mul',
    'div',
    'add',
    'sub',
    'set'
].forEach(function (method) {
    Vector2D[method] = Function('vector, x, y, z, value', 'return vector.copy().' + method + '( x, y, z, value );');
});
Vector2D.random = function random() {
    var x;
    if (options.degrees) {
        x = 360;
    } else {
        x = Math.PI * 2;
    }
    return Vector2D.fromAngle(Math.random() * x);
};
Vector2D.fromAngle = function fromAngle(angle) {
    if (options.degrees) {
        angle *= Math.PI / 180;
    }
    return new Vector2D(Math.cos(angle), Math.sin(angle));
};
Vector2D.cross = function cross(a, b) {
    return a.x * b.y - a.y * b.x;
};
module.exports = Vector2D;
},{"../options":95}],92:[function(require,module,exports){
'use strict';
var Vector2D = require('./Vector2D');
var options = require('../options');
function Vector3D(x, y, z) {
    this.set(x, y, z);
}
Vector3D.prototype = {
    set: function set(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        return this;
    },
    setVector: function setVector(vector) {
        return this.set(vector.x, vector.y, vector.z);
    },
    lerp: function lerp(x, y, z, value) {
        this.x += (x - this.x) * value || 0;
        this.y += (y - this.y) * value || 0;
        this.z += (z - this.z) * value || 0;
        return this;
    },
    lerpVector: function lerpVector(vector, value) {
        var x = vector.x || 0, y = vector.y || 0, z = vector.z || 0;
        return this.lerp(x, y, z, value);
    },
    add: function add(x, y, z) {
        this.x += x || 0;
        this.y += y || 0;
        this.z += z || 0;
        return this;
    },
    addVector: function addVector(vector) {
        return this.add(vector.x, vector.y, vector.z);
    },
    sub: function sub(x, y, z) {
        this.x -= x || 0;
        this.y -= y || 0;
        this.z -= z || 0;
        return this;
    },
    subVector: function subVector(vector) {
        return this.sub(vector.x, vector.y, vector.z);
    },
    mul: function mul(value) {
        this.x *= value || 0;
        this.y *= value || 0;
        this.z *= value || 0;
        return this;
    },
    mulVector: function mulVector(vector) {
        this.x *= vector.x || 0;
        this.y *= vector.y || 0;
        this.z *= vector.z || 0;
        return this;
    },
    div: function div(value) {
        this.x /= value || 0;
        this.y /= value || 0;
        this.z /= value || 0;
        return this;
    },
    divVector: function divVector(vector) {
        this.x /= vector.x || 0;
        this.y /= vector.y || 0;
        this.z /= vector.z || 0;
        return this;
    },
    magSquare: function magSquare() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },
    dot: function dot(x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    },
    dotVector: function dotVector(vector) {
        var x = vector.x || 0, y = vector.y || 0, z = vector.z || 0;
        return this.dot(x, y, z);
    },
    copy: function copy() {
        return new Vector3D(this.x, this.y, this.z);
    },
    dist: function dist(vector) {
        var x = vector.x - this.x, y = vector.y - this.y, z = vector.z - this.z;
        return Math.sqrt(x * x + y * y + z * z);
    },
    toString: function toString() {
        return 'vec3(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ', ' + this.z.toFixed(2) + ')';
    },
    normalize: Vector2D.prototype.normalize,
    setAngle: Vector2D.prototype.setAngle,
    setMag: Vector2D.prototype.setMag,
    rotate: Vector2D.prototype.rotate,
    angle: Vector2D.prototype.angle,
    limit: Vector2D.prototype.limit,
    mag: Vector2D.prototype.mag,
    constructor: Vector3D
};
[
    'normalize',
    'setMag',
    'rotate',
    'limit',
    'lerp',
    'mul',
    'div',
    'add',
    'sub',
    'set'
].forEach(function (method) {
    Vector3D[method] = Vector2D[method];
});
Vector3D.random = function random() {
    var theta = Math.random() * Math.PI * 2, z = Math.random() * 2 - 1, n = Math.root(1 - z * z);
    return new Vector3D(n * Math.cos(theta), n * Math.sin(theta), z);
};
Vector3D.fromAngle = function fromAngle(angle) {
    if (options.degrees) {
        angle *= Math.PI / 180;
    }
    return new Vector3D(Math.cos(angle), Math.sin(angle));
};
module.exports = Vector3D;
},{"../options":95,"./Vector2D":91}],93:[function(require,module,exports){
'use strict';
var Vector2D = require('./Vector2D');
module.exports = function vec2(x, y) {
    return new Vector2D(x, y);
};
},{"./Vector2D":91}],94:[function(require,module,exports){
'use strict';
var Vector3D = require('./Vector3D');
module.exports = function vec3(x, y, z) {
    return new Vector3D(x, y, z);
};
},{"./Vector3D":92}],95:[function(require,module,exports){
'use strict';
module.exports = { degress: false };
},{}],96:[function(require,module,exports){
'use strict';
if (typeof platform === 'undefined') {
    var platform;
    try {
        platform = function () {
            throw new Error('Cannot find module \'platform\' from \'/home/silent/git/v6.js\'');
        }();
    } catch (ex) {
    }
}
module.exports = platform;
},{}],97:[function(require,module,exports){
'use strict';
var once = require('peako/once'), platform = require('./platform'), _getContextNameGL = require('./_getContextNameGL'), RendererGL = require('./RendererGL'), Renderer2D = require('./Renderer2D'), constants = require('./constants'), report = require('./report'), o = require('./rendererOptions');
var getRendererMode = once(function () {
        var touchable, safari;
        if (typeof window !== 'undefined') {
            touchable = 'ontouchstart' in window && 'ontouchmove' in window && 'ontouchend' in window;
        }
        if (platform) {
            safari = platform.os && platform.os.family === 'iOS' && platform.name === 'Safari';
        }
        if (touchable && !safari) {
            return constants.MODE_GL;
        }
        return constants.MODE_2D;
    });
module.exports = function renderer(options) {
    var mode = options && options.mode || o.mode;
    if (mode === constants.MODE_AUTO) {
        mode = getRendererMode();
    }
    if (mode === constants.MODE_GL) {
        if (_getContextNameGL()) {
            return new RendererGL(options);
        }
        report('Cannot create WebGL context, fallback to 2D.');
    }
    if (mode === constants.MODE_2D || mode === constants.MODE_GL) {
        return new Renderer2D(options);
    }
};
},{"./Renderer2D":67,"./RendererGL":68,"./_getContextNameGL":76,"./constants":87,"./platform":96,"./rendererOptions":98,"./report":99,"peako/once":50}],98:[function(require,module,exports){
'use strict';
module.exports = {
    settings: {
        color: require('./colors/RGBA'),
        smooth: false,
        scale: 1
    },
    antialias: true,
    blending: true,
    degrees: false,
    append: true,
    alpha: true,
    mode: '2d'
};
},{"./colors/RGBA":81}],99:[function(require,module,exports){
'use strict';
var report, reported;
if (typeof console !== 'undefined' && console.warn) {
    reported = {};
    report = function report(message) {
        if (reported[message]) {
            return;
        }
        console.warn(message);
        reported[message] = true;
    };
} else {
    report = require('peako/noop');
}
module.exports = report;
},{"peako/noop":48}],100:[function(require,module,exports){
'use strict';
var Ticker = require('./Ticker');
module.exports = function ticker(update, render, context) {
    return new Ticker(update, render, context);
};
},{"./Ticker":70}],101:[function(require,module,exports){
'use strict';
var v6 = {
        Camera: require('./Camera'),
        CompoundedImage: require('./CompoundedImage'),
        HSLA: require('./colors/HSLA'),
        Image: require('./Image'),
        RGBA: require('./colors/RGBA'),
        Renderer2D: require('./Renderer2D'),
        RendererGL: require('./RendererGL'),
        ShaderProgram: require('./ShaderProgram'),
        Ticker: require('./Ticker'),
        Transform: require('./Transform'),
        Vector2D: require('./math/Vector2D'),
        Vector3D: require('./math/Vector3D'),
        camera: require('./camera'),
        color: require('./colors/color'),
        constants: require('./constants'),
        defaultShaders: require('./defaultShaders'),
        hsla: require('./colors/hsla'),
        image: require('./image'),
        options: require('./options'),
        platform: require('./platform'),
        renderer: require('./renderer'),
        rendererOptions: require('./rendererOptions'),
        rgba: require('./colors/rgba'),
        ticker: require('./ticker'),
        vec2: require('./math/vec2'),
        vec3: require('./math/vec3')
    };
if (typeof self !== 'undefined') {
    self.v6 = v6;
}
module.exports = v6;
},{"./Camera":62,"./CompoundedImage":63,"./Image":65,"./Renderer2D":67,"./RendererGL":68,"./ShaderProgram":69,"./Ticker":70,"./Transform":71,"./camera":79,"./colors/HSLA":80,"./colors/RGBA":81,"./colors/color":83,"./colors/hsla":85,"./colors/rgba":86,"./constants":87,"./defaultShaders":88,"./image":89,"./math/Vector2D":91,"./math/Vector3D":92,"./math/vec2":93,"./math/vec3":94,"./options":95,"./platform":96,"./renderer":97,"./rendererOptions":98,"./ticker":100}]},{},[101]);
