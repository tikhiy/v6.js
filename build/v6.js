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
},{"./type":65}],2:[function(require,module,exports){
'use strict';
module.exports = function apply(fn, ctx, args) {
    switch (args.length) {
    case 0:
        return fn.call(ctx);
    case 1:
        return fn.call(ctx, args[0]);
    case 2:
        return fn.call(ctx, args[0], args[1]);
    case 3:
        return fn.call(ctx, args[0], args[1], args[2]);
    case 4:
        return fn.call(ctx, args[0], args[1], args[2], args[3]);
    }
    return fn.apply(ctx, args);
};
},{}],3:[function(require,module,exports){
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
},{"../isset":47}],4:[function(require,module,exports){
'use strict';
module.exports = function baseExec(regexp, string) {
    var result = [], value;
    regexp.lastIndex = 0;
    while (value = regexp.exec(string)) {
        result.push(value);
    }
    return result;
};
},{}],5:[function(require,module,exports){
'use strict';
var callIteratee = require('../call-iteratee'), isset = require('../isset');
module.exports = function baseForEach(arr, fn, ctx, fromRight) {
    var j = arr.length - 1, i = -1, idx;
    for (; j >= 0; --j) {
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
},{"../call-iteratee":16,"../isset":47}],6:[function(require,module,exports){
'use strict';
var callIteratee = require('../call-iteratee');
module.exports = function baseForIn(obj, fn, ctx, keys, fromRight) {
    var j = keys.length - 1, i = -1, key;
    for (; j >= 0; --j) {
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
},{"../call-iteratee":16}],7:[function(require,module,exports){
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
},{"../isset":47}],8:[function(require,module,exports){
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
},{"./base-to-index":12}],9:[function(require,module,exports){
'use strict';
module.exports = function baseIsMatch() {
};
},{}],10:[function(require,module,exports){
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
},{"../support/support-keys":59,"./base-index-of":8}],11:[function(require,module,exports){
'use strict';
var baseIsMatch = require('./base-is-match');
module.exports = function baseMatches(src) {
    return function matches(obj) {
        if (obj == null) {
            return false;
        }
        return obj === src || baseIsMatch(src, obj);
    };
};
},{"./base-is-match":9}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
'use strict';
module.exports = function baseValues(obj, keys) {
    var i = keys.length, values = Array(i--);
    for (; i >= 0; --i) {
        values[i] = obj[keys[i]];
    }
    return values;
};
},{}],14:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR, defaultTo = require('./default-to'), apply = require('./apply');
module.exports = function before(n, target) {
    var value;
    if (typeof target !== 'function') {
        throw TypeError(ERR.FUNCTION_EXPECTED);
    }
    n = defaultTo(n, 1);
    return function () {
        if (--n >= 0) {
            value = apply(target, this, arguments);
        }
        return value;
    };
};
},{"./apply":2,"./constants":20,"./default-to":27}],15:[function(require,module,exports){
'use strict';
var constants = require('./constants');
var indexOf = require('./index-of');
var apply = require('./apply');
var _bind = Function.prototype.bind || function bind(c) {
        var f = this;
        var a;
        if (arguments.length <= 2) {
            return function bound() {
                return apply(f, c, arguments);
            };
        }
        a = Array.prototype.slice.call(arguments, 1);
        return function bound() {
            return apply(f, c, a.concat(Array.prototype.slice.call(arguments)));
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
        return apply(f, c, process(p, arguments));
    };
};
},{"./apply":2,"./constants":20,"./index-of":35}],16:[function(require,module,exports){
'use strict';
module.exports = function callIteratee(fn, ctx, val, key, obj) {
    if (typeof ctx === 'undefined') {
        return fn(val, key, obj);
    }
    return fn.call(ctx, val, key, obj);
};
},{}],17:[function(require,module,exports){
'use strict';
var rProperty = require('./regexps').property, baseExec = require('./base/base-exec'), unescape = require('./unescape'), isKey = require('./is-key'), toKey = require('./to-key'), _type = require('./_type');
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
},{"./_type":1,"./base/base-exec":4,"./is-key":39,"./regexps":56,"./to-key":62,"./unescape":66}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
'use strict';
var create = require('./create'), getPrototypeOf = require('./get-prototype-of'), toObject = require('./to-object'), each = require('./each'), isPrimitive = require('./is-primitive');
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
        } else if (deep && !isPrimitive(value)) {
            this[key] = clone(deep, value);
        } else {
            this[key] = value;
        }
    }, cln);
    return cln;
};
},{"./create":21,"./each":30,"./get-prototype-of":34,"./is-primitive":44,"./to-object":63}],20:[function(require,module,exports){
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
    MIME: {
        URLENCODED: 'application/x-www-form-urlencoded',
        JSON: 'application/json'
    }
};
},{}],21:[function(require,module,exports){
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
},{"./define-properties":29,"./is-primitive":44,"./set-prototype-of":57}],22:[function(require,module,exports){
'use strict';
var baseForEach = require('../base/base-for-each'), baseForIn = require('../base/base-for-in'), isArrayLike = require('../is-array-like'), toObject = require('../to-object'), iteratee = require('../iteratee').iteratee, keys = require('../keys');
module.exports = function createEach(fromRight) {
    return function each(obj, fn, ctx) {
        obj = toObject(obj);
        fn = iteratee(fn);
        if (isArrayLike(obj)) {
            return baseForEach(obj, fn, ctx, fromRight);
        }
        return baseForIn(obj, fn, ctx, keys(obj), fromRight);
    };
};
},{"../base/base-for-each":5,"../base/base-for-in":6,"../is-array-like":37,"../iteratee":49,"../keys":50,"../to-object":63}],23:[function(require,module,exports){
'use strict';
var baseForEach = require('../base/base-for-each'), toObject = require('../to-object'), iteratee = require('../iteratee').iteratee, iterable = require('../iterable');
module.exports = function createForEach(fromRight) {
    return function forEach(arr, fn, ctx) {
        return baseForEach(iterable(toObject(arr)), iteratee(fn), ctx, fromRight);
    };
};
},{"../base/base-for-each":5,"../iterable":48,"../iteratee":49,"../to-object":63}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
'use strict';
var baseIndexOf = require('../base/base-index-of'), toObject = require('../to-object');
module.exports = function createIndexOf(fromRight) {
    return function indexOf(arr, search, fromIndex) {
        return baseIndexOf(toObject(arr), search, fromIndex, fromRight);
    };
};
},{"../base/base-index-of":8,"../to-object":63}],26:[function(require,module,exports){
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
},{"../constants":20}],27:[function(require,module,exports){
'use strict';
module.exports = function defaultTo(value, defaultValue) {
    if (value != null && value === value) {
        return value;
    }
    return defaultValue;
};
},{}],28:[function(require,module,exports){
'use strict';
var mixin = require('./mixin'), clone = require('./clone');
module.exports = function defaults(defaults, object) {
    return mixin(true, clone(true, defaults), object);
};
},{"./clone":19,"./mixin":51}],29:[function(require,module,exports){
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
},{"./base/base-define-property":3,"./each":30,"./is-primitive":44,"./support/support-define-property":58}],30:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-each')();
},{"./create/create-each":22}],31:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-for-each')(true);
},{"./create/create-for-each":23}],32:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Height');
},{"./create/create-get-element-dimension":24}],33:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Width');
},{"./create/create-get-element-dimension":24}],34:[function(require,module,exports){
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
},{"./constants":20}],35:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-index-of')();
},{"./create/create-index-of":25}],36:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length'), isWindowLike = require('./is-window-like');
module.exports = function isArrayLikeObject(value) {
    return isObjectLike(value) && isLength(value.length) && !isWindowLike(value);
};
},{"./is-length":40,"./is-object-like":41,"./is-window-like":46}],37:[function(require,module,exports){
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
},{"./is-length":40,"./is-window-like":46}],38:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length');
var toString = {}.toString;
module.exports = Array.isArray || function isArray(value) {
    return isObjectLike(value) && isLength(value.length) && toString.call(value) === '[object Array]';
};
},{"./is-length":40,"./is-object-like":41}],39:[function(require,module,exports){
'use strict';
var rDeepKey = require('./regexps').deepKey, _type = require('./_type');
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
},{"./_type":1,"./regexps":56}],40:[function(require,module,exports){
'use strict';
var MAX_ARRAY_LENGTH = require('./constants').MAX_ARRAY_LENGTH;
module.exports = function isLength(value) {
    return typeof value === 'number' && value >= 0 && value <= MAX_ARRAY_LENGTH && value % 1 === 0;
};
},{"./constants":20}],41:[function(require,module,exports){
'use strict';
module.exports = function isObjectLike(value) {
    return !!value && typeof value === 'object';
};
},{}],42:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
var toString = {}.toString;
module.exports = function isObject(value) {
    return isObjectLike(value) && toString.call(value) === '[object Object]';
};
},{"./is-object-like":41}],43:[function(require,module,exports){
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
},{"./get-prototype-of":34,"./is-object":42}],44:[function(require,module,exports){
'use strict';
module.exports = function isPrimitive(value) {
    return !value || typeof value !== 'object' && typeof value !== 'function';
};
},{}],45:[function(require,module,exports){
'use strict';
var type = require('./type');
module.exports = function isSymbol(value) {
    return type(value) === 'symbol';
};
},{"./type":65}],46:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
module.exports = function isWindowLike(value) {
    return isObjectLike(value) && value.window === value;
};
},{"./is-object-like":41}],47:[function(require,module,exports){
'use strict';
module.exports = function isset(key, obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[key] !== 'undefined' || key in obj;
};
},{}],48:[function(require,module,exports){
'use strict';
var isArrayLikeObject = require('./is-array-like-object'), baseValues = require('./base/base-values'), keys = require('./keys');
module.exports = function iterable(value) {
    if (isArrayLikeObject(value)) {
        return value;
    }
    if (typeof value === 'string') {
        return value.split('');
    }
    return baseValues(value, keys(value));
};
},{"./base/base-values":13,"./is-array-like-object":36,"./keys":50}],49:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), baseMatches = require('./base/base-matches'), property = require('./property');
exports.iteratee = function iteratee(v) {
    if (typeof v === 'function') {
        return v;
    }
    if (isObjectLike(v)) {
        return baseMatches(v);
    }
    return property(v);
};
},{"./base/base-matches":11,"./is-object-like":41,"./property":55}],50:[function(require,module,exports){
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
},{"./base/base-keys":10,"./support/support-keys":59,"./to-object":63}],51:[function(require,module,exports){
'use strict';
var toObject = require('./to-object'), getKeys = require('./keys'), isPlainObject = require('./is-plain-object'), isArray = require('./is-array');
function mixin(deep, target) {
    var length = arguments.length, i, keys, exp, j, k, val, key, nowArray, src;
    if (typeof deep !== 'boolean') {
        target = deep;
        deep = true;
        i = 1;
    } else {
        i = 2;
    }
    if (i === length) {
        target = this;
        --i;
    }
    target = toObject(target);
    for (; i < length; ++i) {
        keys = getKeys(exp = toObject(arguments[i]));
        for (j = 0, k = keys.length; j < k; ++j) {
            val = exp[key = keys[j]];
            if (deep && val !== exp && (isPlainObject(val) || (nowArray = isArray(val)))) {
                src = target[key];
                if (nowArray) {
                    if (!isArray(src)) {
                        src = [];
                    }
                    nowArray = false;
                } else if (!isPlainObject(src)) {
                    src = {};
                }
                target[key] = mixin(true, src, val);
            } else {
                target[key] = val;
            }
        }
    }
    return target;
}
module.exports = mixin;
},{"./is-array":38,"./is-plain-object":43,"./keys":50,"./to-object":63}],52:[function(require,module,exports){
'use strict';
module.exports = function noop() {
};
},{}],53:[function(require,module,exports){
'use strict';
module.exports = Date.now || function now() {
    return new Date().getTime();
};
},{}],54:[function(require,module,exports){
'use strict';
var before = require('./before');
module.exports = function once(target) {
    return before(1, target);
};
},{"./before":14}],55:[function(require,module,exports){
'use strict';
var castPath = require('./cast-path'), noop = require('./noop'), get = require('./base/base-get');
module.exports = function property(path) {
    var l = (path = castPath(path)).length;
    if (!l) {
        return noop;
    }
    if (l > 1) {
        return function (obj) {
            if (obj != null) {
                return get(obj, path, 0);
            }
        };
    }
    path = path[0];
    return function (obj) {
        if (obj != null) {
            return obj[path];
        }
    };
};
},{"./base/base-get":7,"./cast-path":17,"./noop":52}],56:[function(require,module,exports){
'use strict';
module.exports = {
    selector: /^(?:#([\w-]+)|([\w-]+)|\.([\w-]+))$/,
    property: /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi,
    deepKey: /(^|[^\\])(\\\\)*(\.|\[)/,
    singleTag: /^(<([\w-]+)><\/[\w-]+>|<([\w-]+)(?:\s*\/)?>)$/,
    notSpaces: /[^\s\uFEFF\xA0]+/g
};
},{}],57:[function(require,module,exports){
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
},{"./constants":20,"./is-primitive":44}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
'use strict';
var timestamp = require('./timestamp');
var request, cancel;
if (typeof window !== 'undefined') {
    cancel = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame;
    request = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
}
var noRequestAnimationFrame = !request || !cancel || typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test(navigator.userAgent);
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
        return request(animate);
    };
    exports.cancel = function cancel(id) {
        return cancel(id);
    };
}
},{"./timestamp":61}],61:[function(require,module,exports){
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
},{"./now":53}],62:[function(require,module,exports){
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
},{"./is-symbol":45,"./unescape":66}],63:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR;
module.exports = function toObject(value) {
    if (value == null) {
        throw TypeError(ERR.UNDEFINED_OR_NULL);
    }
    return Object(value);
};
},{"./constants":20}],64:[function(require,module,exports){
'use strict';
if (String.prototype.trim) {
    module.exports = require('./bind')(Function.prototype.call, String.prototype.trim);
} else {
    module.exports = require('./create/create-trim')(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/);
}
},{"./bind":15,"./create/create-trim":26}],65:[function(require,module,exports){
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
},{"./create":21}],66:[function(require,module,exports){
'use strict';
module.exports = function unescape(string) {
    return string.replace(/\\(\\)?/g, '$1');
};
},{}],67:[function(require,module,exports){
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
            this.offset = new Vector2D(renderer.width * 0.5, renderer.height * 0.5);
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
        return x + w > at.x - off.x / this.zoom && x < at.x + (renderer.width - off.x) / this.zoom && y + h > at.y - off.y / this.zoom && y < at.y + (renderer.height - off.y) / this.zoom;
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
},{"./math/Vector2D":88,"peako/default-to":27}],68:[function(require,module,exports){
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
},{}],69:[function(require,module,exports){
'use strict';
function Font() {
}
Font.prototype = { constructor: Font };
module.exports = Font;
},{}],70:[function(require,module,exports){
'use strict';
var bind = require('peako/bind');
var CompoundedImage = require('./CompoundedImage');
var report = require('./report');
function Image(url) {
    this.loaded = false;
    this.x = 0;
    this.y = 0;
    if (typeof window !== 'undefined' && url instanceof window.HTMLImageElement) {
        if (url.src) {
            if (url.complete) {
                this._onload();
            } else if (url.onload === null) {
                url.onload = bind(this._onload, this);
            } else {
                report('In new v6.Image: you should manually set "loaded" property if you are using "new v6.Image( image )" with "onload" listener');
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
        throw TypeError('In new v6.Image: first argument must be a string or a HTMLImageElement object');
    }
}
Image.prototype = {
    _onload: function _onload(e) {
        if (e) {
            this.image.onload = null;
        }
        this.loaded = true;
        this.w = this.image.width;
        this.h = this.image.height;
    },
    load: function load() {
        if (this.loaded) {
            return this;
        }
        this.image.onload = this._onload;
        this.image.src = this.url;
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
        throw Error('In v6.Image.cut: cannot cut the image because the new image W is out of bounds');
    }
    y += image.y;
    if (y + h > image.y + image.h) {
        throw Error('In v6.Image.cut: cannot cut the image because the new image H is out of bounds');
    }
    return new CompoundedImage(image.get(), x, y, w, h);
};
module.exports = Image;
},{"./CompoundedImage":68,"./report":95,"peako/bind":15}],71:[function(require,module,exports){
'use strict';
var getElementW = require('peako/get-element-w');
var getElementH = require('peako/get-element-h');
var _setDefaultDrawingSettings = require('./_setDefaultDrawingSettings');
var _copyDrawingSettings = require('./_copyDrawingSettings');
var _getContextNameGL = require('./_getContextNameGL');
var CompoundedImage = require('./CompoundedImage');
var constants = require('./constants');
var Image = require('./Image');
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
    _setDefaultDrawingSettings(this, this);
    this.settings = options.settings;
    this.mode = mode;
    this.index = rendererIndex;
    this._stack = [];
    this._stackIndex = -1;
    this._vertices = [];
    if ('width' in options || 'height' in options) {
        this.resize(options.width, options.height);
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
    constructor: Renderer
};
module.exports = null;
},{"./CompoundedImage":68,"./Image":70,"./_copyDrawingSettings":76,"./_getContextNameGL":77,"./_setDefaultDrawingSettings":78,"./constants":87,"peako/get-element-h":32,"peako/get-element-w":33}],72:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var constants = require('./constants');
var Renderer = require('./Renderer');
var o = require('./options');
function Renderer2D(options) {
    options = defaults(options, o.renderer);
    Renderer.call(this, options, constants.MODE_2D);
    this.smooth(this.settings.smooth);
    this.matrix = this.context;
    this._beginPath = false;
}
Renderer2D.prototype = Object.create(Renderer.prototype);
Renderer2D.prototype = {
    smooth: function () {
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
    }(),
    backgroundColor: function backgroundColor(r, g, b, a) {
        var context = this.context;
        context.save();
        context.setTransform(this.settings.scale, 0, 0, this.settings.scale, 0, 0);
        context.fillStyle = this.color(r, g, b, a);
        context.fillRect(0, 0, this.w, this.h);
        context.restore();
        return this;
    },
    backgroundImage: function backgroundImage(image) {
        var _rectAlignX = this._rectAlignX, _rectAlignY = this._rectAlignY;
        this._rectAlignX = 'left';
        this._rectAlignY = 'top';
        this.image(Image.stretch(image, this.w, this.h), 0, 0);
        this._rectAlignX = _rectAlignX;
        this._rectAlignY = _rectAlignY;
        return this;
    },
    constructor: Renderer2D
};
module.exports = Renderer2D;
},{"./Renderer":71,"./constants":87,"./options":92,"peako/defaults":28}],73:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var Transform = require('./Transform');
var constants = require('./constants');
var Renderer = require('./Renderer');
var o = require('./options');
function RendererGL(options) {
    options = defaults(options, o.renderer);
    Renderer.call(this, options, constants.MODE_GL);
    this.matrix = new Transform();
    this.buffers = {
        default: this.context.createBuffer(),
        rect: this.context.createBuffer()
    };
    this.shaders = {};
    this.addShaders(shaders);
    this.useShaders(shaders);
    this.blending(options.blending);
}
RendererGL.prototype = Object.create(Renderer.prototype);
RendererGL.prototype.resize = function resize(w, h) {
    Renderer.prototype.resize.call(this, w, h);
    this.context.viewport(0, 0, this.w, this.h);
    return this;
};
RendererGL.prototype.addShaders = function addShaders(shaders) {
    this.shaders.push(shaders);
};
RendererGL.prototype.constructor = RendererGL;
module.exports = RendererGL;
},{"./Renderer":71,"./Transform":75,"./constants":87,"./options":92,"peako/defaults":28}],74:[function(require,module,exports){
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
},{"./constants":87,"peako/noop":52,"peako/timer":60,"peako/timestamp":61}],75:[function(require,module,exports){
'use strict';
function Transform() {
}
Transform.prototype = { constructor: Transform };
module.exports = Transform;
},{}],76:[function(require,module,exports){
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
},{}],77:[function(require,module,exports){
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
},{"peako/once":54}],78:[function(require,module,exports){
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
    obj._strokeColor = renderer.color();
    obj._fillColor = renderer.color();
    obj._font = new Font();
    return obj;
};
},{"./Font":69,"./_copyDrawingSettings":76}],79:[function(require,module,exports){
'use strict';
var Camera = require('./Camera');
module.exports = function camera(options, renderer) {
    return new Camera(options, renderer);
};
},{"./Camera":67}],80:[function(require,module,exports){
'use strict';
module.exports = HSLA;
var clamp = require('peako/clamp');
var _parseColor = require('./_parseColor');
var RGBA = require('./RGBA');
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
},{"./RGBA":81,"./_parseColor":82,"peako/clamp":18}],81:[function(require,module,exports){
'use strict';
module.exports = RGBA;
var _parseColor = require('./_parseColor');
var HSLA = require('./HSLA');
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
},{"./HSLA":80,"./_parseColor":82}],82:[function(require,module,exports){
'use strict';
module.exports = _parseColor;
var create = require('peako/create');
var trim = require('peako/trim');
var RGBA = require('./RGBA');
var HSLA = require('./HSLA');
var colors = require('./colors');
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
},{"./HSLA":80,"./RGBA":81,"./colors":84,"peako/create":21,"peako/trim":64}],83:[function(require,module,exports){
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
var forEachRight = require('peako/for-each-right');
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
forEachRight([
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
], function (method) {
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
},{"../options":92,"peako/for-each-right":31}],89:[function(require,module,exports){
'use strict';
var forEachRight = require('peako/for-each-right');
var options = require('../options');
var Vector2D = require('./Vector2D');
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
forEachRight([
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
], function (method) {
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
},{"../options":92,"./Vector2D":88,"peako/for-each-right":31}],90:[function(require,module,exports){
'use strict';
var Vector2D = require('./Vector2D');
module.exports = function vec2(x, y) {
    return new Vector2D(x, y);
};
},{"./Vector2D":88}],91:[function(require,module,exports){
'use strict';
var Vector3D = require('./Vector3D');
module.exports = function vec3(x, y, z) {
    return new Vector3D(x, y, z);
};
},{"./Vector3D":89}],92:[function(require,module,exports){
'use strict';
var constants = require('./constants');
module.exports = {
    renderer: {
        settings: {
            colorMode: constants.RGBA,
            smooth: false,
            scale: 1
        },
        antialias: true,
        blending: true,
        degrees: false,
        append: true,
        alpha: true,
        mode: '2d'
    },
    colorMode: constants.RGBA
};
},{"./constants":87}],93:[function(require,module,exports){
'use strict';
if (typeof platform === 'undefined') {
    var platform;
    try {
        platform = function () {
            throw new Error('Cannot find module \'platform\' from \'/home/silent/git/v6/src\'');
        }();
    } catch (ex) {
    }
}
module.exports = platform;
},{}],94:[function(require,module,exports){
'use strict';
var once = require('peako/once');
var _getContextNameGL = require('./_getContextNameGL');
var defaultOptions = require('./options');
var RendererGL = require('./RendererGL');
var Renderer2D = require('./Renderer2D');
var constants = require('./constants');
var platform = require('./platform');
var report = require('./report');
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
    var mode = options && options.mode || defaultOptions.renderer.mode;
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
},{"./Renderer2D":72,"./RendererGL":73,"./_getContextNameGL":77,"./constants":87,"./options":92,"./platform":93,"./report":95,"peako/once":54}],95:[function(require,module,exports){
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
},{"peako/noop":52}],96:[function(require,module,exports){
'use strict';
var Ticker = require('./Ticker');
module.exports = function ticker(update, render, context) {
    return new Ticker(update, render, context);
};
},{"./Ticker":74}],97:[function(require,module,exports){
'use strict';
var v6 = {
        Camera: require('./Camera'),
        HSLA: require('./colors/HSLA'),
        RGBA: require('./colors/RGBA'),
        Renderer2D: require('./Renderer2D'),
        RendererGL: require('./RendererGL'),
        Ticker: require('./Ticker'),
        Vector2D: require('./math/Vector2D'),
        Vector3D: require('./math/Vector3D'),
        camera: require('./camera'),
        color: require('./colors/color'),
        constants: require('./constants'),
        hsla: require('./colors/hsla'),
        options: require('./options'),
        platform: require('./platform'),
        renderer: require('./renderer'),
        rgba: require('./colors/rgba'),
        ticker: require('./ticker'),
        vec2: require('./math/vec2'),
        vec3: require('./math/vec3')
    };
if (typeof window !== 'undefined') {
    window.v6 = v6;
}
if (typeof self !== 'undefined') {
    self.v6 = v6;
}
module.exports = v6;
},{"./Camera":67,"./Renderer2D":72,"./RendererGL":73,"./Ticker":74,"./camera":79,"./colors/HSLA":80,"./colors/RGBA":81,"./colors/color":83,"./colors/hsla":85,"./colors/rgba":86,"./constants":87,"./math/Vector2D":88,"./math/Vector3D":89,"./math/vec2":90,"./math/vec3":91,"./options":92,"./platform":93,"./renderer":94,"./ticker":96}]},{},[97]);
