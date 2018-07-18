(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = function apply ( target, context, args ) {
  switch ( args.length ) {
    case 0:
      return target.call( context );
    case 1:
      return target.call( context, args[ 0 ] );
    case 2:
      return target.call( context, args[ 0 ], args[ 1 ] );
    case 3:
      return target.call( context, args[ 0 ], args[ 1 ], args[ 2 ] );
  }

  return target.apply( context, args );
};

},{}],2:[function(require,module,exports){
'use strict';

var has = require( '../has' );

module.exports = function baseAccessor ( object, path, offset, value, setValue ) {
  var i = 0,
      len = path.length - offset,
      key, hasPath, last;

  if ( setValue ) {
    last = len - 1;
  }

  for ( ; i < len; ++i ) {
    hasPath = has( key = path[ i ], object );

    if ( setValue ) {
      if ( i === last ) {
        object = object[ key ] = value;
      } else if ( hasPath ) {
        object = object[ key ];
      } else {
        object = object[ key ] = {};
      }
    } else if ( hasPath ) {
      object = object[ key ];
    } else {
      return;
    }
  }

  return object;
};

},{"../has":26}],3:[function(require,module,exports){
'use strict';

var has = require( '../has' );

var defineGetter = Object.prototype.__defineGetter__,
    defineSetter = Object.prototype.__defineSetter__;

function baseDefineProperty ( object, key, descriptor ) {
  var hasGetter = has( 'get', descriptor ),
      hasSetter = has( 'set', descriptor ),
      get, set;

  if ( hasGetter || hasSetter ) {
    if ( hasGetter && typeof ( get = descriptor.get ) !== 'function' ) {
      throw TypeError( 'Getter must be a function: ' + get );
    }

    if ( hasSetter && typeof ( set = descriptor.set ) !== 'function' ) {
      throw TypeError( 'Setter must be a function: ' + set );
    }

    if ( has( 'writable', descriptor ) ) {
      throw TypeError( 'Invalid property descriptor. Cannot both specify accessors and a value or writable attribute' );
    }

    if ( defineGetter ) {
      if ( hasGetter ) {
        defineGetter.call( object, key, get );
      }

      if ( hasSetter ) {
        defineSetter.call( object, key, set );
      }
    } else {
      throw Error( "Can't define setter/getter" );
    }
  } else if ( has( 'value', descriptor ) || ! has( key, object ) ) {
    object[ key ] = descriptor.value;
  }

  return object;
}

module.exports = baseDefineProperty;

},{"../has":26}],4:[function(require,module,exports){
'use strict';

module.exports = function baseExec ( regexp, string ) {
  var result = [],
      value;

  regexp.lastIndex = 0;

  while ( ( value = regexp.exec( string ) ) ) {
    result.push( value );
  }

  return result;
};

},{}],5:[function(require,module,exports){
'use strict';

var has          = require( '../has' ),
    callIteratee = require( '../call-iteratee' );

module.exports = function baseForEach ( arr, fun, ctx, fromRight ) {
  var i = -1,
      j = arr.length - 1,
      index;

  for ( ; j >= 0; --j ) {
    if ( fromRight ) {
      index = j;
    } else {
      index = ++i;
    }

    if ( has( index, arr ) && callIteratee( fun, ctx, arr[ index ], index, arr ) === false ) {
      break;
    }
  }

  return arr;
};

},{"../call-iteratee":12,"../has":26}],6:[function(require,module,exports){
'use strict';

var callIteratee = require( '../call-iteratee' );

module.exports = function baseForIn ( obj, fun, ctx, keys, fromRight ) {
  var i = -1,
      j = keys.length - 1,
      key;

  for ( ; j >= 0; --j ) {
    if ( fromRight ) {
      key = keys[ j ];
    } else {
      key = keys[ ++i ];
    }

    if ( callIteratee( fun, ctx, obj[ key ], key, obj ) === false ) {
      break;
    }
  }

  return obj;
};

},{"../call-iteratee":12}],7:[function(require,module,exports){
'use strict';

var baseToIndex = require( './base-to-index' );

var arr = [];

function baseIndexOf ( iterable, search, fromIndex, fromRight ) {
  var length, i, j, index, value;

  // use the native functions if supported and the search is not nan.
  if ( arr.indexOf && search === search ) {
    if ( ! fromRight ) {
      return arr.indexOf.call( iterable, search, fromIndex );
    }

    if ( arr.lastIndexOf ) {
      return arr.lastIndexOf.call( iterable, search, fromIndex );
    }
  }

  length = iterable.length;

  // if the iterable is empty then just return -1.
  if ( ! length ) {
    return -1;
  }

  j = length - 1;

  if ( fromIndex !== undefined ) {
    fromIndex = baseToIndex( fromIndex, length );

    if ( fromRight ) {
      j = Math.min( j, fromIndex );
    } else {
      j = Math.max( 0, fromIndex );
    }

    i = j - 1;
  } else {
    i = -1;
  }

  for ( ; j >= 0; --j ) {
    if ( fromRight ) {
      index = j;
    } else {
      index = ++i;
    }

    value = iterable[ index ];

    if ( value === search || value !== value && search !== search ) {
      return index;
    }
  }

  return -1;
}

module.exports = baseIndexOf;

},{"./base-to-index":8}],8:[function(require,module,exports){
'use strict';

module.exports = function baseToIndex ( value, length ) {
  if ( ! length || ! value ) {
    return 0;
  }

  if ( value < 0 ) {
    value += length;
  }

  return value || 0;
};

},{}],9:[function(require,module,exports){
'use strict';

module.exports = function baseValues ( object, keys ) {
  var i = keys.length,
      values = Array( i-- );

  for ( ; i >= 0; --i ) {
    values[ i ] = object[ keys[ i ] ];
  }

  return values;
};

},{}],10:[function(require,module,exports){
'use strict';

var ERR       = require( './constants' ).ERR,
    defaultTo = require( './default-to' ),
    apply     = require( './apply' );

module.exports = function before ( n, target ) {
  var value;

  if ( typeof target !== 'function' ) {
    throw TypeError( ERR.FUNCTION_EXPECTED );
  }

  n = defaultTo( n, 1 );

  return function () {
    if ( --n >= 0 ) {
      value = apply( target, this, arguments );
    }

    return value;
  };
};

},{"./apply":1,"./constants":14,"./default-to":21}],11:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function bindFast ( target, context ) {
  if ( typeof target !== 'function' ) {
    throw TypeError( ERR.FUNCTION_EXPECTED );
  }

  return function ( a, b, c, d, e, f, g, h ) {
    switch ( arguments.length ) {
      case 0:
        return target.call( context );
      case 1:
        return target.call( context, a );
      case 2:
        return target.call( context, a, b );
      case 3:
        return target.call( context, a, b, c );
      case 4:
        return target.call( context, a, b, c, d );
      case 5:
        return target.call( context, a, b, c, d, e );
      case 6:
        return target.call( context, a, b, c, d, e, f );
      case 7:
        return target.call( context, a, b, c, d, e, f, g );
      case 8:
        return target.call( context, a, b, c, d, e, f, g, h );
    }

    return target.apply( context, arguments );
  };
};

},{"./constants":14}],12:[function(require,module,exports){
'use strict';

var undefined;

module.exports = function callIteratee ( fun, ctx, val, key, obj ) {
  if ( ctx === undefined ) {
    return fun( val, key, obj );
  }

  return fun.call( ctx, val, key, obj );
};

},{}],13:[function(require,module,exports){
'use strict';

module.exports = function clamp ( value, lower, upper ) {
  if ( value >= upper ) {
    return upper;
  }

  if ( value <= lower ) {
    return lower;
  }

  return value;
};

},{}],14:[function(require,module,exports){
'use strict';

module.exports = {
  ERR: {
    INVALID_ARGS:          'Invalid arguments',
    FUNCTION_EXPECTED:     'Expected a function',
    STRING_EXPECTED:       'Expected a string',
    UNDEFINED_OR_NULL:     'Cannot convert undefined or null to object',
    REDUCE_OF_EMPTY_ARRAY: 'Reduce of empty array with no initial value'
  },

  MAX_ARRAY_LENGTH: 4294967295,
  MAX_SAFE_INT:     9007199254740991,
  MIN_SAFE_INT:    -9007199254740991,

  MIME: {
    URLENCODED: 'application/x-www-form-urlencoded',
    JSON:       'application/json'
  }
};

},{}],15:[function(require,module,exports){
'use strict';

var isPrimitive      = require( './is-primitive' ),
    setPrototypeOf   = require( './set-prototype-of' ),
    defineProperties = require( './define-properties' );

function Constructor () {}

module.exports = Object.create || function create ( prototype, descriptors ) {
  var object;

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  Constructor.prototype = prototype;

  object = new Constructor();

  Constructor.prototype = null;

  if ( prototype === null ) {
    setPrototypeOf( object, prototype );
  }

  if ( arguments.length >= 2 ) {
    defineProperties( object, descriptors );
  }

  return object;
};

},{"./define-properties":22,"./is-primitive":34,"./set-prototype-of":45}],16:[function(require,module,exports){
'use strict';

var toObject     = require( '../to-object' ),
    isArrayLike  = require( '../is-array-like' ),
    baseForEach  = require( '../base/base-for-each' ),
    baseForIn    = require( '../base/base-for-in' ),
    getKeys      = require( '../keys' ),
    wrapIteratee = require( '../iteratee' );

module.exports = function createEach ( fromRight ) {
  return function ( iterable, iteratee, context ) {
    iterable = toObject( iterable );
    iteratee = wrapIteratee( iteratee );

    if ( isArrayLike( iterable ) ) {
      return baseForEach( iterable, iteratee, context, fromRight );
    }

    return baseForIn( iterable, iteratee, context, getKeys( iterable ), fromRight );
  };
};

},{"../base/base-for-each":5,"../base/base-for-in":6,"../is-array-like":29,"../iteratee":38,"../keys":39,"../to-object":50}],17:[function(require,module,exports){
'use strict';

var toObject     = require( '../to-object' ),
    has          = require( '../has' ),
    callIteratee = require( '../call-iteratee' );

module.exports = function createFind ( returnIndex, fromRight ) {
  return function ( arr, fun, ctx ) {
    var j = ( arr = toObject( arr ) ).length - 1,
        i = -1,
        idx, val;

    for ( ; j >= 0; --j ) {
      if ( fromRight ) {
        idx = j;
      } else {
        idx = ++i;
      }

      val = arr[ idx ];

      if ( has( idx, arr ) && callIteratee( fun, ctx, val, idx, arr ) ) {
        if ( returnIndex ) {
          return idx;
        }

        return val;
      }
    }

    if ( returnIndex ) {
      return -1;
    }
  };
};

},{"../call-iteratee":12,"../has":26,"../to-object":50}],18:[function(require,module,exports){
'use strict';

var getIterable  = require( '../iterable' ),
    wrapIteratee = require( '../iteratee' ),
    toObject     = require( '../to-object' ),
    baseForEach  = require( '../base/base-for-each' );

module.exports = function createForEach ( fromRight ) {
  return function ( iterable, iteratee, context ) {
    return baseForEach( getIterable( toObject( iterable ) ), wrapIteratee( iteratee ), context, fromRight );
  };
};

},{"../base/base-for-each":5,"../iterable":37,"../iteratee":38,"../to-object":50}],19:[function(require,module,exports){
'use strict';

var baseIndexOf = require( '../base/base-index-of' ),
    toObject = require( '../to-object' );

module.exports = function createIndexOf ( fromRight ) {
  return function ( iterable, search, fromIndex ) {
    return baseIndexOf( toObject( iterable ), search, fromIndex, fromRight );
  };
};

},{"../base/base-index-of":7,"../to-object":50}],20:[function(require,module,exports){
'use strict';

var ERR = require( '../constants' ).ERR;

module.exports = function createTrim ( regexp ) {
  return function ( string ) {
    if ( string == null ) {
      throw TypeError( ERR.UNDEFINED_OR_NULL );
    }

    return ( '' + string ).replace( regexp, '' );
  };
};

},{"../constants":14}],21:[function(require,module,exports){
'use strict';

module.exports = function defaultTo ( value, defaultValue ) {
  if ( value != null && value === value ) {
    return value;
  }

  return defaultValue;
};

},{}],22:[function(require,module,exports){
'use strict';

var support = require( './support/support-define-property' );

var defineProperties, baseDefineProperty, isPrimitive, each;

if ( support !== 'full' ) {
  isPrimitive        = require( './is-primitive' );
  each               = require( './each' );
  baseDefineProperty = require( './base/base-define-property' );

  defineProperties = function defineProperties ( object, descriptors ) {
    if ( support !== 'not-supported' ) {
      try {
        return Object.defineProperties( object, descriptors );
      } catch ( e ) {}
    }

    if ( isPrimitive( object ) ) {
      throw TypeError( 'defineProperties called on non-object' );
    }

    if ( isPrimitive( descriptors ) ) {
      throw TypeError( 'Property description must be an object: ' + descriptors );
    }

    each( descriptors, function ( descriptor, key ) {
      if ( isPrimitive( descriptor ) ) {
        throw TypeError( 'Property description must be an object: ' + descriptor );
      }

      baseDefineProperty( this, key, descriptor );
    }, object );

    return object;
  };
} else {
  defineProperties = Object.defineProperties;
}

module.exports = defineProperties;

},{"./base/base-define-property":3,"./each":23,"./is-primitive":34,"./support/support-define-property":46}],23:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-each' )();

},{"./create/create-each":16}],24:[function(require,module,exports){
'use strict';

if ( Array.prototype.find ) {
  module.exports = require( './bind-fast' )( Function.prototype.call, Array.prototype.find );
} else {
  module.exports = require( './create/create-find' )();
}

},{"./bind-fast":11,"./create/create-find":17}],25:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-for-each' )( true );

},{"./create/create-for-each":18}],26:[function(require,module,exports){
'use strict';

module.exports = function has ( key, obj ) {
  if ( obj == null ) {
    return false;
  }

  return obj[ key ] !== undefined || key in obj;
};

},{}],27:[function(require,module,exports){
'use strict';

module.exports = require( './create/create-index-of' )();

},{"./create/create-index-of":19}],28:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLikeObject ( value ) {
  return isObjectLike( value ) && isLength( value.length ) && ! isWindowLike( value );
};

},{"./is-length":32,"./is-object-like":33,"./is-window-like":36}],29:[function(require,module,exports){
'use strict';

var isLength     = require( './is-length' ),
    isWindowLike = require( './is-window-like' );

module.exports = function isArrayLike ( value ) {
  if ( value == null ) {
    return false;
  }

  if ( typeof value === 'object' ) {
    return isLength( value.length ) && !isWindowLike( value );
  }

  return typeof value === 'string';
};

},{"./is-length":32,"./is-window-like":36}],30:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' ),
    isLength = require( './is-length' );

var toString = {}.toString;

module.exports = Array.isArray || function isArray ( value ) {
  return isObjectLike( value ) &&
    isLength( value.length ) &&
    toString.call( value ) === '[object Array]';
};

},{"./is-length":32,"./is-object-like":33}],31:[function(require,module,exports){
'use strict';

var isArray  = require( './is-array' ),
    rDeepKey = require( './regexps' ).deepKey;

module.exports = function isKey ( value ) {
  var type;

  if ( ! value ) {
    return true;
  }

  if ( isArray( value ) ) {
    return false;
  }

  type = typeof value;

  if ( type === 'number' || type === 'symbol' || type === 'boolean' ) {
    return true;
  }

  return ! rDeepKey.test( value );
};

},{"./is-array":30,"./regexps":44}],32:[function(require,module,exports){
'use strict';

var MAX_ARRAY_LENGTH = require( './constants' ).MAX_ARRAY_LENGTH;

module.exports = function isLength ( value ) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH &&
    value % 1 === 0;
};

},{"./constants":14}],33:[function(require,module,exports){
'use strict';

module.exports = function isObjectLike ( value ) {
  return !! value && typeof value === 'object';
};

},{}],34:[function(require,module,exports){
'use strict';

module.exports = function isPrimitive ( value ) {
  return ! value ||
    typeof value !== 'object' &&
    typeof value !== 'function';
};

},{}],35:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

var toString = {}.toString;

module.exports = function isSymbol ( value ) {
  // disable "Invalid typeof value 'symbol' (W122)" (esversion: 3)
  // jshint -W122
  return typeof value === 'symbol' ||
  // jshint +W122
    isObjectLike( value ) &&
    toString.call( value ) === '[object Symbol]';
};

},{"./is-object-like":33}],36:[function(require,module,exports){
'use strict';

var isObjectLike = require( './is-object-like' );

module.exports = function isWindowLike ( value ) {
  return isObjectLike( value ) && value.window === value;
};

},{"./is-object-like":33}],37:[function(require,module,exports){
'use strict';

var isArrayLikeObject = require( './is-array-like-object' ),
    baseValues        = require( './base/base-values' ),
    getKeys           = require( './keys' );

module.exports = function iterable ( value ) {
  if ( isArrayLikeObject( value ) ) {
    return value;
  }

  if ( typeof value === 'string' ) {
    return value.split( '' );
  }

  return baseValues( value, getKeys( value ) );
};

},{"./base/base-values":9,"./is-array-like-object":28,"./keys":39}],38:[function(require,module,exports){
'use strict';

var isKey    = require( './is-key' ),
    property = require( './property' ),
    ERR      = require( './constants' ).ERR;

module.exports = function iteratee ( value ) {
  if ( typeof value === 'function' ) {
    return value;
  }

  if ( isKey( value ) ) {
    return property( value );
  }

  throw TypeError( ERR.FUNCTION_EXPECTED );
};

},{"./constants":14,"./is-key":31,"./property":43}],39:[function(require,module,exports){
'use strict';

var toObject = require( './to-object' ),
    indexOf = require( './index-of' );

var hasOwnProperty = {}.hasOwnProperty;

var getKeys, support, notEnumerables, fixKeys, baseKeys;

if ( Object.keys ) {
  try {
    support = Object.keys( '' ), 'es2015';
  } catch ( e ) {
    support = 'es5';
  }
} else if ( { toString: null }.propertyIsEnumerable( 'toString' ) ) {
  support = 'not-supported';
} else {
  support = 'has-a-bug';
}

// Base implementation of `Object.keys` polyfill.
if ( support !== 'es2015' ) {
  if ( support === 'not-supported' ) {
    notEnumerables = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];

    fixKeys = function fixKeys ( keys, object ) {
      var i = notEnumerables.length - 1,
          key;

      for ( ; i >= 0; --i ) {
        key = notEnumerables[ i ];

        if ( indexOf( keys, key ) < 0 && hasOwnProperty.call( object, key ) ) {
          keys.push( key );
        }
      }

      return keys;
    };
  }

  baseKeys = function baseKeys ( object ) {
    var keys = [],
        key;

    for ( key in object ) {
      if ( hasOwnProperty.call( object, key ) ) {
        keys.push( key );
      }
    }

    if ( support !== 'not-supported' ) {
      return keys;
    }

    return fixKeys( keys, object );
  };
}

if ( support !== 'es2015' ) {
  getKeys = function ( val ) {
    return baseKeys( toObject( val ) );
  };
} else {
  getKeys = Object.keys;
}

module.exports = getKeys;

},{"./index-of":27,"./to-object":50}],40:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],41:[function(require,module,exports){
'use strict';

var undefined;

module.exports = Date.now || function now () {
  return new Date().getTime();
};

},{}],42:[function(require,module,exports){
'use strict';

var before = require( './before' );

module.exports = function once ( target ) {
  return before( 1, target );
};

},{"./before":10}],43:[function(require,module,exports){
'use strict';

var toPath       = require( './to-path' ),
    baseAccessor = require( './base/base-accessor' ),
    noop         = require( './noop' );

module.exports = function property ( path ) {
  var len = ( path = toPath( path ) ).length;

  if ( len > 1 ) {
    return function ( object ) {
      if ( object != null ) {
        return baseAccessor( object, path, 0 );
      }
    };
  }

  if ( len ) {
    return function ( object ) {
      if ( object != null ) {
        return object[ path ];
      }
    };
  }

  return noop;
};

},{"./base/base-accessor":2,"./noop":40,"./to-path":51}],44:[function(require,module,exports){
'use strict';

module.exports = {
  selector:  /^(?:#([\w-]+)|([\w-]+)|\.([\w-]+))$/,
  property:  /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi,
  deepKey:   /(^|[^\\])(\\\\)*(\.|\[)/,
  singleTag: /^(<([\w-]+)><\/[\w-]+>|<([\w-]+)(?:\s*\/)?>)$/,
  notSpaces: /[^\s\uFEFF\xA0]+/g
};

},{}],45:[function(require,module,exports){
'use strict';

var isPrimitive = require( './is-primitive' ),
    ERR         = require( './constants' ).ERR;

module.exports = Object.setPrototypeOf || function setPrototypeOf ( target, prototype ) {
  if ( target == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  if ( prototype !== null && isPrimitive( prototype ) ) {
    throw TypeError( 'Object prototype may only be an Object or null: ' + prototype );
  }

  if ( ! isPrimitive( target ) && '__proto__' in target ) {
    // jshint proto: true
    target.__proto__ = prototype;
    // jshint proto: false
  }

  return target;
};

},{"./constants":14,"./is-primitive":34}],46:[function(require,module,exports){
'use strict';

var support;

function test ( target ) {
  try {
    if ( '' in Object.defineProperty( target, '', {} ) ) {
      return true;
    }
  } catch ( e ) {}

  return false;
}

if ( test( {} ) ) {
  support = 'full';
} else if ( typeof document !== 'undefined' && test( document.createElement( 'span' ) ) ) {
  support = 'dom';
} else {
  support = 'not-supported';
}

module.exports = support;

},{}],47:[function(require,module,exports){
/**
 * Based on Erik Möller requestAnimationFrame polyfill:
 *
 * Adapted from https://gist.github.com/paulirish/1579671 which derived from
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 *
 * requestAnimationFrame polyfill by Erik Möller.
 * Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon.
 *
 * MIT license
 */

'use strict';

var timestamp = require( './timestamp' );

var request, cancel;

if ( typeof window !== 'undefined' ) {
  cancel = window[ 'cancelAnimationFrame' ] ||
    window[ 'webkitCancelAnimationFrame' ] ||
    window[ 'webkitCancelRequestAnimationFrame' ] ||
    window[ 'mozCancelAnimationFrame' ] ||
    window[ 'mozCancelRequestAnimationFrame' ];
  request = window[ 'requestAnimationFrame' ] ||
    window[ 'webkitRequestAnimationFrame' ] ||
    window[ 'mozRequestAnimationFrame' ];
}

var noRequestAnimationFrame = ! request || ! cancel ||
  typeof navigator !== 'undefined' && /iP(ad|hone|od).*OS\s6/.test( navigator.userAgent );

var timer = {};

if ( noRequestAnimationFrame ) {
  var lastRequestTime = 0,
      frameDuration   = 1000 / 60;

  timer.request = function request ( animate ) {
    var now             = timestamp(),
        nextRequestTime = Math.max( lastRequestTime + frameDuration, now );

    return setTimeout( function () {
      lastRequestTime = nextRequestTime;
      animate( now );
    }, nextRequestTime - now );
  };

  timer.cancel = clearTimeout;
} else {
  timer.request = function request ( animate ) {
    return request( animate );
  };

  timer.cancel = function cancel ( id ) {
    return cancel( id );
  };
}

module.exports = timer;

},{"./timestamp":48}],48:[function(require,module,exports){
'use strict';

var getTime = require( './now' );

var timestamp, navigatorStart;

if ( typeof perfomance === 'undefined' || ! perfomance.now ) {
  if ( typeof perfomance !== 'undefined' && perfomance.timing ) {
    navigatorStart = perfomance.timing.navigatorStart;
  }

  if ( ! navigatorStart ) {
    navigatorStart = getTime();
  }

  timestamp = function timestamp () {
    return getTime() - navigatorStart
  };
} else {
  timestamp = perfomance.now;
}

module.exports = timestamp;

},{"./now":41}],49:[function(require,module,exports){
'use strict';

var unescape = require( './unescape' ),
    isSymbol = require( './is-symbol' );

module.exports = function toKey ( val ) {
  var key;

  if ( typeof val === 'string' ) {
    return unescape( val );
  }

  if ( isSymbol( val ) ) {
    return val;
  }

  key = '' + val;

  if ( key === '0' && 1 / val === -Infinity ) {
    return '-0';
  }

  return unescape( key );
};

},{"./is-symbol":35,"./unescape":53}],50:[function(require,module,exports){
'use strict';

var ERR = require( './constants' ).ERR;

module.exports = function toObject ( value ) {
  if ( value == null ) {
    throw TypeError( ERR.UNDEFINED_OR_NULL );
  }

  return Object( value );
};

},{"./constants":14}],51:[function(require,module,exports){
'use strict';

var isKey     = require( './is-key' ),
    toKey     = require( './to-key' ),
    isArray   = require( './is-array' ),
    unescape  = require( './unescape' ),
    baseExec  = require( './base/base-exec' ),
    rProperty = require( './regexps' ).property;

function stringToPath ( string ) {
  var path = baseExec( rProperty, string ),
      i = path.length - 1,
      value;

  for ( ; i >= 0; --i ) {
    value = path[ i ];

    // .name
    if ( value[ 2 ] ) {
      path[ i ] = value[ 2 ];
    // [ "" ] || [ '' ]
    } else if ( value[ 5 ] != null ) {
      path[ i ] = unescape( value[ 5 ] );
    // [ 0 ]
    } else {
      path[ i ] = value[ 3 ];
    }
  }

  return path;
}

module.exports = function toPath ( value ) {
  var parsed, len, i;

  if ( isKey( value ) ) {
    return [
      toKey( value )
    ];
  }

  if ( isArray( value ) ) {
    parsed = Array( len = value.length );

    for ( i = len - 1; i >= 0; --i ) {
      parsed[ i ] = toKey( value[ i ] );
    }
  } else {
    parsed = stringToPath( '' + value );
  }

  return parsed;
};

},{"./base/base-exec":4,"./is-array":30,"./is-key":31,"./regexps":44,"./to-key":49,"./unescape":53}],52:[function(require,module,exports){
'use strict';

if ( String.prototype.trim ) {
  module.exports = require( './bind-fast' )( Function.prototype.call, String.prototype.trim );
} else {
  module.exports = require( './create/create-trim' )( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/ );
}

},{"./bind-fast":11,"./create/create-trim":20}],53:[function(require,module,exports){
'use strict';

module.exports = function unescape ( string ) {
  return string.replace( /\\(\\)?/g, '$1' );
};

},{}],54:[function(require,module,exports){
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
},{"./math/Vector2D":67,"peako/default-to":21}],55:[function(require,module,exports){
'use strict';
var timer = require('peako/timer'), timestamp = require('peako/timestamp'), noop = require('peako/noop');
var undefined;
function Ticker(update, render, context) {
    var self = this;
    if (context === undefined) {
        if (typeof render !== 'function') {
            return new Ticker(update, null, render);
        }
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
    this.context = context;
    function tick(now) {
        var elapsedTime;
        if (!self.running) {
            if (!now) {
                self.lastRequestAnimationFrameID = timer.request(tick);
                self.lastRequestTime = timestamp();
                self.running = true;
            }
            return;
        }
        if (!now) {
            now = timestamp();
        }
        elapsedTime = Math.min(1, (now - self.lastRequestTime) * 0.001);
        self.skippedTime += elapsedTime;
        self.totalTime += elapsedTime;
        while (self.skippedTime >= self.step && self.running) {
            self.skippedTime -= self.step;
            if (self.context) {
                self.update.call(self.context, self.step, now);
            } else {
                self.update(self.step, now);
            }
        }
        if (self.context) {
            self.render.call(self.context, elapsedTime, now);
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
},{"peako/noop":40,"peako/timer":47,"peako/timestamp":48}],56:[function(require,module,exports){
'use strict';
var Camera = require('./Camera');
module.exports = function camera(options, renderer) {
    return new Camera(options, renderer);
};
},{"./Camera":54}],57:[function(require,module,exports){
'use strict';
module.exports = HSLA;
var clamp = require('peako/clamp');
var parseColor = require('./parse-color'), RGBA = require('./RGBA');
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
            h = parseColor(h);
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
},{"./RGBA":58,"./parse-color":62,"peako/clamp":13}],58:[function(require,module,exports){
'use strict';
module.exports = RGBA;
var parseColor = require('./parse-color'), HSLA = require('./HSLA');
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
            r = parseColor(r);
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
            color = parseColor(color);
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
},{"./HSLA":57,"./parse-color":62}],59:[function(require,module,exports){
'use strict';
var RGBA = require('./RGBA'), parseColor = require('./parse-color');
module.exports = function color(a, b, c, d) {
    if (typeof a !== 'string') {
        return new RGBA(a, b, c, d);
    }
    return parseColor(a);
};
},{"./RGBA":58,"./parse-color":62}],60:[function(require,module,exports){
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
},{}],61:[function(require,module,exports){
'use strict';
var HSLA = require('./HSLA');
module.exports = function rgba(h, s, l, a) {
    return new HSLA(h, s, l, a);
};
},{"./HSLA":57}],62:[function(require,module,exports){
'use strict';
module.exports = parseColor;
var create = require('peako/create'), trim = require('peako/trim');
var RGBA = require('./RGBA'), HSLA = require('./HSLA'), colors = require('./colors');
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
function parseColor(string) {
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
},{"./HSLA":57,"./RGBA":58,"./colors":60,"peako/create":15,"peako/trim":52}],63:[function(require,module,exports){
'use strict';
var RGBA = require('./RGBA');
module.exports = function rgba(r, g, b, a) {
    return new RGBA(r, g, b, a);
};
},{"./RGBA":58}],64:[function(require,module,exports){
'use strict';
module.exports = {
    RENDERER_MODE_WEBGL: 1,
    RENDERER_MODE_AUTO: 2,
    RENDERER_MODE_2D: 3,
    RGBA: 4,
    HSLA: 5
};
},{}],65:[function(require,module,exports){
'use strict';
var constants = require('./constants');
module.exports = {
    renderer: {
        settings: {
            colorMode: constants.HSLA,
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
},{"./constants":64}],66:[function(require,module,exports){
'use strict';
var once = require('peako/once'), find = require('peako/find');
module.exports = once(function () {
    var canvas = document.createElement('canvas'), types, type, i;
    if (typeof canvas.getContext === 'function') {
        types = [
            'webgl',
            'experimental-webgl',
            'moz-webgl',
            'webkit-3d'
        ];
        type = find(types, function (type) {
            return canvas.getContext(type) !== null;
        });
    }
    canvas = null;
    return type;
});
},{"peako/find":24,"peako/once":42}],67:[function(require,module,exports){
'use strict';
var forEachRight = require('peako/for-each-right');
var options = require('../default-options');
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
},{"../default-options":65,"peako/for-each-right":25}],68:[function(require,module,exports){
'use strict';
var forEachRight = require('peako/for-each-right');
var Vector2D = require('./Vector2D'), options = require('../default-options');
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
},{"../default-options":65,"./Vector2D":67,"peako/for-each-right":25}],69:[function(require,module,exports){
'use strict';
var Vector2D = require('./Vector2D');
module.exports = function vec2(x, y) {
    return new Vector2D(x, y);
};
},{"./Vector2D":67}],70:[function(require,module,exports){
'use strict';
var Vector3D = require('./Vector3D');
module.exports = function vec3(x, y, z) {
    return new Vector3D(x, y, z);
};
},{"./Vector3D":68}],71:[function(require,module,exports){
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
},{}],72:[function(require,module,exports){
'use strict';
var undefined;
function Renderer2D(options) {
}
module.exports = Renderer2D;
},{}],73:[function(require,module,exports){
'use strict';
var undefined;
function RendererWebGL(options) {
}
module.exports = RendererWebGL;
},{}],74:[function(require,module,exports){
'use strict';
var once = require('peako/once');
var getWebGLContextName = require('./get-webgl-context-name'), defaultOptions = require('./default-options'), RendererWebGL = require('./renderer-webgl/RendererWebGL'), Renderer2D = require('./renderer-2d/Renderer2D'), constants = require('./constants'), platform = require('./platform'), report = require('./report');
var getRendererMode;
function renderer(options) {
    var mode = options && options.mode || defaultOptions.renderer.mode;
    if (mode === constants.RENDERER_MODE_AUTO) {
        mode = getRendererMode();
    }
    if (mode === constants.RENDERER_MODE_WEBGL) {
        if (getWebGLContextName()) {
            return new RendererWebGL(options);
        }
        report('Cannot create WebGL context, fallback to 2D.');
    }
    if (mode === constants.RENDERER_MODE_2D || mode === constants.RENDERER_MODE_WEBGL) {
        return new Renderer2D(options);
    }
}
getRendererMode = once(function () {
    var touchable = 'ontouchstart' in root && 'ontouchmove' in root && 'ontouchend' in root;
    var safari;
    if (platform) {
        safari = platform.os && platform.os.family === 'iOS' && platform.name === 'Safari';
    } else {
        safari = false;
    }
    if (touchable && !safari) {
        return constants.RENDERER_MODE_WEBGL;
    }
    return constants.RENDERER_MODE_2D;
});
module.exports = renderer;
},{"./constants":64,"./default-options":65,"./get-webgl-context-name":66,"./platform":71,"./renderer-2d/Renderer2D":72,"./renderer-webgl/RendererWebGL":73,"./report":75,"peako/once":42}],75:[function(require,module,exports){
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
},{"peako/noop":40}],76:[function(require,module,exports){
'use strict';
var Ticker = require('./Ticker');
module.exports = function ticker(update, render, context) {
    return new Ticker(update, render, context);
};
},{"./Ticker":55}],77:[function(require,module,exports){
'use strict';
var v6 = {
        Camera: require('./Camera'),
        HSLA: require('./colors/HSLA'),
        RGBA: require('./colors/RGBA'),
        Renderer2D: require('./renderer-2d/Renderer2D'),
        RendererWebGL: require('./renderer-webgl/RendererWebGL'),
        Ticker: require('./Ticker'),
        Vector2D: require('./math/Vector2D'),
        Vector3D: require('./math/Vector3D'),
        camera: require('./camera'),
        color: require('./colors/color'),
        constants: require('./constants'),
        hsla: require('./colors/hsla'),
        options: require('./default-options'),
        platform: require('./platform'),
        renderer: require('./renderer'),
        rgba: require('./colors/rgba'),
        ticker: require('./ticker'),
        vec2: require('./math/vec2'),
        vec3: require('./math/vec3')
    };
if (typeof module !== 'undefined') {
    module.exports = v6;
} else if (typeof window !== 'undefined') {
    window.v6 = v6;
}
},{"./Camera":54,"./Ticker":55,"./camera":56,"./colors/HSLA":57,"./colors/RGBA":58,"./colors/color":59,"./colors/hsla":61,"./colors/rgba":63,"./constants":64,"./default-options":65,"./math/Vector2D":67,"./math/Vector3D":68,"./math/vec2":69,"./math/vec3":70,"./platform":71,"./renderer":74,"./renderer-2d/Renderer2D":72,"./renderer-webgl/RendererWebGL":73,"./ticker":76}]},{},[77]);
