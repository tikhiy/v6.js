(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
var defaultTo = require('peako/default-to');
var Vector2D = require('./math/Vector2D');
function Camera(renderer, options) {
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
    this.linearZoomIn = defaultTo(options.linearZoomIn, true);
    this.linearZoomOut = defaultTo(options.linearZoomOut, true);
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
        var pos = this.position;
        var off = this.offset;
        pos[2] = off.x / this.zoom - at.x;
        pos[3] = off.y / this.zoom - at.y;
        pos[4] = at.x;
        pos[5] = at.y;
        return this;
    },
    shouldLookAt: function shouldLookAt() {
        return new Vector2D(this.position[4], this.position[5]);
    },
    looksAt: function looksAt() {
        var x = (this.offset.x - this.position[0] * this.zoom) / this.zoom;
        var y = (this.offset.y - this.position[1] * this.zoom) / this.zoom;
        return new Vector2D(x, y);
    },
    sees: function sees(x, y, w, h, renderer) {
        var off = this.offset;
        var at = this.looksAt();
        if (!renderer) {
            renderer = this.renderer;
        }
        return x + w > at.x - off.x / this.zoom && x < at.x + (renderer.w - off.x) / this.zoom && y + h > at.y - off.y / this.zoom && y < at.y + (renderer.h - off.y) / this.zoom;
    },
    zoomIn: function zoomIn() {
        var speed;
        if (this.zoom !== this.maxZoom) {
            if (this.linearZoomIn) {
                speed = this.zoomInSpeed * this.zoom;
            } else {
                speed = this.zoomInSpeed;
            }
            this.zoom = Math.min(this.zoom + speed, this.maxZoom);
        }
    },
    zoomOut: function zoomOut() {
        var speed;
        if (this.zoom !== this.minZoom) {
            if (this.linearZoomOut) {
                speed = this.zoomOutSpeed * this.zoom;
            } else {
                speed = this.zoomOutSpeed;
            }
            this.zoom = Math.max(this.zoom - speed, this.minZoom);
        }
    },
    constructor: Camera
};
module.exports = Camera;
},{"./math/Vector2D":20,"peako/default-to":59}],2:[function(require,module,exports){
'use strict';
var createProgram = require('./internal/create_program');
var createShader = require('./internal/create_shader');
function ShaderProgram(sources, gl) {
    var vert = createShader(sources.vert, gl.VERTEX_SHADER, gl);
    var frag = createShader(sources.frag, gl.FRAGMENT_SHADER, gl);
    this._program = createProgram(vert, frag, gl);
    this._gl = gl;
    this._uniforms = {};
    this._attrs = {};
    this._uniformIndex = gl.getProgramParameter(this._program, gl.ACTIVE_UNIFORMS);
    this._attrIndex = gl.getProgramParameter(this._program, gl.ACTIVE_ATTRIBUTES);
}
ShaderProgram.prototype = {
    use: function use() {
        this._gl.useProgram(this._program);
        return this;
    },
    setAttr: function setAttr(name, size, type, normalized, stride, offset) {
        var location = this.getAttr(name).location;
        this._gl.enableVertexAttribArray(location);
        this._gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        return this;
    },
    getUniform: function getUniform(name) {
        var uniform = this._uniforms[name];
        var index, info;
        if (uniform) {
            return uniform;
        }
        while (--this._uniformIndex >= 0) {
            info = this._gl.getActiveUniform(this._program, this._uniformIndex);
            uniform = {
                location: this._gl.getUniformLocation(this._program, info.name),
                size: info.size,
                type: info.type
            };
            if (info.size > 1 && ~(index = info.name.indexOf('['))) {
                uniform.name = info.name.slice(0, index);
            } else {
                uniform.name = info.name;
            }
            this._uniforms[uniform.name] = uniform;
            if (uniform.name === name) {
                return uniform;
            }
        }
        throw ReferenceError('No "' + name + '" uniform found');
    },
    getAttr: function getAttr(name) {
        var attr = this._attrs[name];
        if (attr) {
            return attr;
        }
        while (--this._attrIndex >= 0) {
            attr = this._gl.getActiveAttrib(this._program, this._attrIndex);
            attr.location = this._gl.getAttribLocation(this._program, name);
            this._attrs[name] = attr;
            if (attr.name === name) {
                return attr;
            }
        }
        throw ReferenceError('No "' + name + '" attribute found');
    },
    constructor: ShaderProgram
};
ShaderProgram.prototype.setUniform = function setUniform(name, value) {
    var uniform = this.getUniform(name);
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
module.exports = ShaderProgram;
},{"./internal/create_program":14,"./internal/create_shader":15}],3:[function(require,module,exports){
'use strict';
var LightEmitter = require('light_emitter');
var timestamp = require('peako/timestamp');
var timer = require('peako/timer');
function Ticker() {
    var self = this;
    LightEmitter.call(this);
    this.lastRequestAnimationFrameID = 0;
    this.lastRequestTime = 0;
    this.skippedTime = 0;
    this.totalTime = 0;
    this.running = false;
    function start(_now) {
        var elapsedTime;
        if (!self.running) {
            if (!_now) {
                self.lastRequestAnimationFrameID = timer.request(start);
                self.lastRequestTime = timestamp();
                self.running = true;
            }
            return this;
        }
        if (!_now) {
            _now = timestamp();
        }
        elapsedTime = Math.min(1, (_now - self.lastRequestTime) * 0.001);
        self.skippedTime += elapsedTime;
        self.totalTime += elapsedTime;
        while (self.skippedTime >= self.step && self.running) {
            self.skippedTime -= self.step;
            self.emit('update', self.step, _now);
        }
        self.emit('render', elapsedTime, _now);
        self.lastRequestTime = _now;
        self.lastRequestAnimationFrameID = timer.request(start);
        return this;
    }
    this.start = start;
    this.fps(60);
}
Ticker.prototype = Object.create(LightEmitter.prototype);
Ticker.prototype.constructor = Ticker;
Ticker.prototype.fps = function fps(fps) {
    this.step = 1 / fps;
    return this;
};
Ticker.prototype.clear = function clear() {
    this.skippedTime = 0;
    return this;
};
Ticker.prototype.stop = function stop() {
    this.running = false;
    return this;
};
module.exports = Ticker;
},{"light_emitter":36,"peako/timer":89,"peako/timestamp":90}],4:[function(require,module,exports){
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
},{"./mat3":18}],5:[function(require,module,exports){
'use strict';
module.exports = HSLA;
var clamp = require('peako/clamp');
var parse = require('./internal/parse');
var RGBA = require('./RGBA');
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
            h = parse(h);
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
            switch (void 0) {
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
        var h = this[0] % 360 / 360;
        var s = this[1] * 0.01;
        var l = this[2] * 0.01;
        var tr = h + 1 / 3;
        var tg = h;
        var tb = h - 1 / 3;
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
    shade: function shade(percentage) {
        var hsla = new HSLA();
        hsla[0] = this[0];
        hsla[1] = this[1];
        hsla[2] = clamp(this[2] + percentage, 0, 100);
        hsla[3] = this[3];
        return hsla;
    },
    constructor: HSLA
};
HSLA.prototype.type = 'hsla';
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
},{"./RGBA":6,"./internal/parse":8,"peako/clamp":52}],6:[function(require,module,exports){
'use strict';
module.exports = RGBA;
var parse = require('./internal/parse');
var HSLA = require('./HSLA');
function RGBA(r, g, b, a) {
    this.set(r, g, b, a);
}
RGBA.prototype = {
    perceivedBrightness: function perceivedBrightness() {
        var r = this[0];
        var g = this[1];
        var b = this[2];
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
            r = parse(r);
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
            switch (void 0) {
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
        var r = this[0] / 255;
        var g = this[1] / 255;
        var b = this[2] / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var l = (max + min) * 50;
        var h, s;
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
        r = this[0] + (r - this[0]) * value;
        g = this[0] + (g - this[0]) * value;
        b = this[0] + (b - this[0]) * value;
        return new RGBA(r, g, b, this[3]);
    },
    lerpColor: function lerpColor(color, value) {
        var r, g, b;
        if (typeof color !== 'object') {
            color = parse(color);
        }
        if (color.type !== 'rgba') {
            color = color.rgba();
        }
        r = color[0];
        g = color[1];
        b = color[2];
        return this.lerp(r, g, b, value);
    },
    shade: function shade(percentages) {
        return this.hsla().shade(percentages).rgba();
    },
    constructor: RGBA
};
RGBA.prototype.type = 'rgba';
},{"./HSLA":5,"./internal/parse":8}],7:[function(require,module,exports){
'use strict';
var colors = {
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
module.exports = colors;
},{}],8:[function(require,module,exports){
'use strict';
module.exports = parse;
var RGBA = require('../RGBA');
var HSLA = require('../HSLA');
var colors = require('./colors');
var parsed = Object.create(null);
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
function parse(string) {
    var cache = parsed[string] || parsed[string = string.trim().toLowerCase()];
    if (!cache) {
        if (cache = colors[string]) {
            cache = new ColorData(parseHex(cache), RGBA);
        } else if ((cache = regexps.hex.exec(string)) || (cache = regexps.hex3.exec(string))) {
            cache = new ColorData(parseHex(formatHex(cache)), RGBA);
        } else if (cache = regexps.rgb.exec(string)) {
            cache = new ColorData(compactMatch(cache), RGBA);
        } else if (cache = regexps.hsl.exec(string)) {
            cache = new ColorData(compactMatch(cache), HSLA);
        } else {
            throw SyntaxError(string + ' is not a valid syntax');
        }
        parsed[string] = cache;
    }
    return new cache.color(cache[0], cache[1], cache[2], cache[3]);
}
function formatHex(match) {
    var r, g, b, a;
    if (match.length === 3) {
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
            Number(match[4]),
            Number(match[5]),
            Number(match[6]),
            Number(match[7])
        ];
    }
    return [
        Number(match[1]),
        Number(match[2]),
        Number(match[3])
    ];
}
function ColorData(match, color) {
    this[0] = match[0];
    this[1] = match[1];
    this[2] = match[2];
    this[3] = match[3];
    this.color = color;
}
},{"../HSLA":5,"../RGBA":6,"./colors":7}],9:[function(require,module,exports){
'use strict';
var _constants = {};
var _counter = 0;
function add(key) {
    if (typeof _constants[key] !== 'undefined') {
        throw Error('Cannot re-set (add) existing constant: ' + key);
    }
    _constants[key] = ++_counter;
}
function get(key) {
    if (typeof _constants[key] === 'undefined') {
        throw ReferenceError('Cannot get unknown constant: ' + key);
    }
    return _constants[key];
}
[
    'AUTO',
    'GL',
    '2D',
    'LEFT',
    'TOP',
    'CENTER',
    'MIDDLE',
    'RIGHT',
    'BOTTOM'
].forEach(add);
exports.add = add;
exports.get = get;
},{}],10:[function(require,module,exports){
'use strict';
var LightEmitter = require('light_emitter');
function AbstractImage() {
    throw Error('Cannot create an instance of the abstract class (new v6.AbstractImage)');
}
AbstractImage.prototype = Object.create(LightEmitter.prototype);
AbstractImage.prototype.constructor = AbstractImage;
module.exports = AbstractImage;
},{"light_emitter":36}],11:[function(require,module,exports){
'use strict';
var AbstractImage = require('./AbstractImage');
function CompoundedImage(image, sx, sy, sw, sh, dw, dh) {
    this.image = image;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
    this.dw = dw;
    this.dh = dh;
}
CompoundedImage.prototype = Object.create(AbstractImage.prototype);
CompoundedImage.prototype.constructor = CompoundedImage;
CompoundedImage.prototype.get = function get() {
    return this.image.get();
};
module.exports = CompoundedImage;
},{"./AbstractImage":10}],12:[function(require,module,exports){
'use strict';
var CompoundedImage = require('./CompoundedImage');
var AbstractImage = require('./AbstractImage');
function Image(image) {
    var self = this;
    if (!image.src) {
        throw Error('Cannot create v6.Image from HTMLImageElement with no "src" attribute (new v6.Image)');
    }
    this.image = image;
    if (this.image.complete) {
        this._init();
    } else {
        this.image.addEventListener('load', function onload() {
            self.image.removeEventListener('load', onload);
            self._init();
        }, false);
    }
}
Image.prototype = Object.create(AbstractImage.prototype);
Image.prototype.constructor = Image;
Image.prototype._init = function _init() {
    this.sx = 0;
    this.sy = 0;
    this.sw = this.dw = this.image.width;
    this.sh = this.dh = this.image.height;
    this.emit('complete');
};
Image.prototype.get = function get() {
    return this;
};
Image.prototype.complete = function complete() {
    return Boolean(this.image.src) && this.image.complete;
};
Image.prototype.src = function src() {
    return this.image.src;
};
Image.fromURL = function fromURL(src) {
    var image = document.createElement('img');
    image.src = src;
    return new Image(image);
};
Image.stretch = function stretch(image, dw, dh) {
    var value = dh / image.dh * image.dw;
    if (value < dw) {
        dh = dw / image.dw * image.dh;
    } else {
        dw = value;
    }
    return new CompoundedImage(image.get(), image.sx, image.sy, image.sw, image.sh, dw, dh);
};
Image.cut = function cut(image, sx, sy, dw, dh) {
    var sw = image.sw / image.dw * dw;
    var sh = image.sh / image.dh * dh;
    sx += image.sx;
    if (sx + sw > image.sx + image.sw) {
        throw Error('Cannot cut the image because the new image X or W is out of bounds (v6.Image.cut)');
    }
    sy += image.sy;
    if (sy + sh > image.sy + image.sh) {
        throw Error('Cannot cut the image because the new image Y or H is out of bounds (v6.Image.cut)');
    }
    return new CompoundedImage(image.get(), sx, sy, sw, sh, dw, dh);
};
module.exports = Image;
},{"./AbstractImage":10,"./CompoundedImage":11}],13:[function(require,module,exports){
'use strict';
var _Float32Array;
if (typeof Float32Array === 'function') {
    _Float32Array = Float32Array;
} else {
    _Float32Array = Array;
}
function createPolygon(sides) {
    var i = Math.floor(sides);
    var step = Math.PI * 2 / sides;
    var vertices = new _Float32Array(i * 2 + 2);
    for (; i >= 0; --i) {
        vertices[i * 2] = Math.cos(step * i);
        vertices[1 + i * 2] = Math.sin(step * i);
    }
    return vertices;
}
module.exports = createPolygon;
},{}],14:[function(require,module,exports){
'use strict';
function createProgram(vert, frag, gl) {
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
}
module.exports = createProgram;
},{}],15:[function(require,module,exports){
'use strict';
function createShader(source, type, gl) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw SyntaxError('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
}
module.exports = createShader;
},{}],16:[function(require,module,exports){
'use strict';
},{}],17:[function(require,module,exports){
'use strict';
var noop = require('peako/noop');
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
    report = noop;
}
module.exports = report;
},{"peako/noop":82}],18:[function(require,module,exports){
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
    m1[0] = 1;
    m1[1] = 0;
    m1[2] = 0;
    m1[3] = 0;
    m1[4] = 1;
    m1[5] = 0;
    m1[6] = 0;
    m1[7] = 0;
    m1[8] = 1;
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
    var m10 = m1[0];
    var m11 = m1[1];
    var m12 = m1[2];
    var m13 = m1[3];
    var m14 = m1[4];
    var m15 = m1[5];
    var x = Math.cos(angle);
    var y = Math.sin(angle);
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
},{}],19:[function(require,module,exports){
'use strict';
var settings = require('../settings');
function AbstractVector() {
    throw Error('Cannot create an instance of the abstract class (new v6.AbstractVector)');
}
AbstractVector.prototype = {
    normalize: function normalize() {
        var mag = this.mag();
        if (mag && mag !== 1) {
            this.div(mag);
        }
        return this;
    },
    setAngle: function setAngle(angle) {
        var mag = this.mag();
        if (settings.degrees) {
            angle *= Math.PI / 180;
        }
        this.x = mag * Math.cos(angle);
        this.y = mag * Math.sin(angle);
        return this;
    },
    setMag: function setMag(value) {
        return this.normalize().mul(value);
    },
    rotate: function rotate(angle) {
        var x = this.x;
        var y = this.y;
        var c, s;
        if (settings.degrees) {
            angle *= Math.PI / 180;
        }
        c = Math.cos(angle);
        s = Math.sin(angle);
        this.x = x * c - y * s;
        this.y = x * s + y * c;
        return this;
    },
    getAngle: function getAngle() {
        if (settings.degrees) {
            return Math.atan2(this.y, this.x) * 180 / Math.PI;
        }
        return Math.atan2(this.y, this.x);
    },
    limit: function limit(value) {
        var mag = this.magSq();
        if (mag > value * value) {
            this.div(Math.sqrt(mag)).mul(value);
        }
        return this;
    },
    mag: function mag() {
        return Math.sqrt(this.magSq());
    },
    constructor: AbstractVector
};
AbstractVector._fromAngle = function _fromAngle(Vector, angle) {
    if (settings.degrees) {
        angle *= Math.PI / 180;
    }
    return new Vector(Math.cos(angle), Math.sin(angle));
};
module.exports = AbstractVector;
},{"../settings":33}],20:[function(require,module,exports){
'use strict';
var settings = require('../settings');
var AbstractVector = require('./AbstractVector');
function Vector2D(x, y) {
    this.set(x, y);
}
Vector2D.prototype = Object.create(AbstractVector.prototype);
Vector2D.prototype.constructor = Vector2D;
Vector2D.prototype.set = function set(x, y) {
    this.x = x || 0;
    this.y = y || 0;
    return this;
};
Vector2D.prototype.add = function add(x, y) {
    this.x += x || 0;
    this.y += y || 0;
    return this;
};
Vector2D.prototype.sub = function sub(x, y) {
    this.x -= x || 0;
    this.y -= y || 0;
    return this;
};
Vector2D.prototype.mul = function mul(value) {
    this.x *= value;
    this.y *= value;
    return this;
};
Vector2D.prototype.div = function div(value) {
    this.x /= value;
    this.y /= value;
    return this;
};
Vector2D.prototype.dot = function dot(x, y) {
    return this.x * (x || 0) + this.y * (y || 0);
};
Vector2D.prototype.lerp = function (x, y, value) {
    this.x += (x - this.x) * value || 0;
    this.y += (y - this.y) * value || 0;
    return this;
};
Vector2D.prototype.setVector = function setVector(vector) {
    return this.set(vector.x, vector.y);
};
Vector2D.prototype.addVector = function addVector(vector) {
    return this.add(vector.x, vector.y);
};
Vector2D.prototype.subVector = function subVector(vector) {
    return this.sub(vector.x, vector.y);
};
Vector2D.prototype.mulVector = function mulVector(vector) {
    this.x *= vector.x;
    this.y *= vector.y;
    return this;
};
Vector2D.prototype.divVector = function divVector(vector) {
    this.x /= vector.x;
    this.y /= vector.y;
    return this;
};
Vector2D.prototype.dotVector = function dotVector(vector) {
    return this.dot(vector.x, vector.y);
};
Vector2D.prototype.lerpVector = function lerpVector(vector, value) {
    return this.lerp(vector.x, vector.y, value);
};
Vector2D.prototype.magSq = function magSq() {
    return this.x * this.x + this.y * this.y;
};
Vector2D.prototype.clone = function clone() {
    return new Vector2D(this.x, this.y);
};
Vector2D.prototype.dist = function dist(vector) {
    var x = vector.x - this.x;
    var y = vector.y - this.y;
    return Math.sqrt(x * x + y * y);
};
Vector2D.prototype.toString = function toString() {
    return 'v6.Vector2D { x: ' + this.x.toFixed(2) + ', y: ' + this.y.toFixed(2) + ' }';
};
Vector2D.random = function random() {
    var value;
    if (settings.degrees) {
        value = 360;
    } else {
        value = Math.PI * 2;
    }
    return Vector2D.fromAngle(Math.random() * value);
};
Vector2D.fromAngle = function fromAngle(angle) {
    return AbstractVector._fromAngle(Vector2D, angle);
};
module.exports = Vector2D;
},{"../settings":33,"./AbstractVector":19}],21:[function(require,module,exports){
'use strict';
var AbstractVector = require('./AbstractVector');
function Vector3D(x, y, z) {
    this.set(x, y, z);
}
Vector3D.prototype = Object.create(AbstractVector.prototype);
Vector3D.prototype.constructor = Vector3D;
Vector3D.prototype.set = function set(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    return this;
};
Vector3D.prototype.add = function add(x, y, z) {
    this.x += x || 0;
    this.y += y || 0;
    this.z += z || 0;
    return this;
};
Vector3D.prototype.sub = function sub(x, y, z) {
    this.x -= x || 0;
    this.y -= y || 0;
    this.z -= z || 0;
    return this;
};
Vector3D.prototype.mul = function mul(value) {
    this.x *= value;
    this.y *= value;
    this.z *= value;
    return this;
};
Vector3D.prototype.div = function div(value) {
    this.x /= value;
    this.y /= value;
    this.z /= value;
    return this;
};
Vector3D.prototype.dot = function dot(x, y, z) {
    return this.x * (x || 0) + this.y * (y || 0) + this.z * (z || 0);
};
Vector3D.prototype.lerp = function (x, y, z, value) {
    this.x += (x - this.x) * value || 0;
    this.y += (y - this.y) * value || 0;
    this.z += (z - this.z) * value || 0;
    return this;
};
Vector3D.prototype.setVector = function setVector(vector) {
    return this.set(vector.x, vector.y, vector.z);
};
Vector3D.prototype.addVector = function addVector(vector) {
    return this.add(vector.x, vector.y, vector.z);
};
Vector3D.prototype.subVector = function subVector(vector) {
    return this.sub(vector.x, vector.y, vector.z);
};
Vector3D.prototype.mulVector = function mulVector(vector) {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;
    return this;
};
Vector3D.prototype.divVector = function divVector(vector) {
    this.x /= vector.x;
    this.y /= vector.y;
    this.z /= vector.z;
    return this;
};
Vector3D.prototype.dotVector = function dotVector(vector) {
    return this.dot(vector.x, vector.y, vector.z);
};
Vector3D.prototype.lerpVector = function lerpVector(vector, value) {
    return this.lerp(vector.x, vector.y, vector.z, value);
};
Vector3D.prototype.magSq = function magSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
};
Vector3D.prototype.clone = function clone() {
    return new Vector3D(this.x, this.y, this.z);
};
Vector3D.prototype.dist = function dist(vector) {
    var x = vector.x - this.x;
    var y = vector.y - this.y;
    var z = vector.z - this.z;
    return Math.sqrt(x * x + y * y + z * z);
};
Vector3D.prototype.toString = function toString() {
    return 'v6.Vector3D { x: ' + this.x.toFixed(2) + ', y: ' + this.y.toFixed(2) + ', z: ' + this.z.toFixed(2) + ' }';
};
Vector3D.random = function random() {
    var theta = Math.random() * Math.PI * 2;
    var z = Math.random() * 2 - 1;
    var n = Math.sqrt(1 - z * z);
    return new Vector3D(n * Math.cos(theta), n * Math.sin(theta), z);
};
Vector3D.fromAngle = function fromAngle(angle) {
    return AbstractVector._fromAngle(Vector3D, angle);
};
module.exports = Vector3D;
},{"./AbstractVector":19}],22:[function(require,module,exports){
'use strict';
var getElementW = require('peako/get-element-w');
var getElementH = require('peako/get-element-h');
var constants = require('../constants');
var createPolygon = require('../internal/create_polygon');
var polygons = require('../internal/polygons');
var setDefaultDrawingSettings = require('./internal/set_default_drawing_settings');
var getWebGL = require('./internal/get_webgl');
var copyDrawingSettings = require('./internal/copy_drawing_settings');
var align = require('./internal/align');
var options = require('./settings');
function AbstractRenderer() {
    throw Error('Cannot create an instance of the abstract class (new v6.AbstractRenderer)');
}
AbstractRenderer.prototype = {
    appendTo: function appendTo(parent) {
        parent.appendChild(this.canvas);
        return this;
    },
    destroy: function destroy() {
        this.canvas.parentNode.removeChild(this.canvas);
        return this;
    },
    push: function push() {
        if (this._stack[++this._stackIndex]) {
            copyDrawingSettings(this._stack[this._stackIndex], this);
        } else {
            this._stack.push(setDefaultDrawingSettings({}, this));
        }
        return this;
    },
    pop: function pop() {
        if (this._stackIndex >= 0) {
            copyDrawingSettings(this, this._stack[this._stackIndex--]);
        } else {
            setDefaultDrawingSettings(this, this);
        }
        return this;
    },
    resize: function resize(w, h) {
        var canvas = this.canvas;
        var scale = this.settings.scale;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
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
    _polygon: function _polygon(x, y, rx, ry, n, a, degrees) {
        var polygon = polygons[n];
        var matrix = this.matrix;
        if (!polygon) {
            polygon = polygons[n] = createPolygon(n);
        }
        if (degrees) {
            a *= Math.PI / 180;
        }
        matrix.save();
        matrix.translate(x, y);
        matrix.rotate(a);
        this.drawArrays(polygon, polygon.length * 0.5, null, rx, ry);
        matrix.restore();
        return this;
    },
    polygon: function polygon(x, y, r, n, a) {
        if (n % 1) {
            n = Math.floor(n * 100) * 0.01;
        }
        if (typeof a === 'undefined') {
            this._polygon(x, y, r, r, n, -Math.PI * 0.5);
        } else {
            this._polygon(x, y, r, r, n, a, options.degrees);
        }
        return this;
    },
    lineWidth: function lineWidth(number) {
        this._lineWidth = number;
        return this;
    },
    stroke: function stroke(r, g, b, a) {
        if (typeof r === 'undefined') {
            this._stroke();
        } else if (typeof r === 'boolean') {
            this._doStroke = r;
        } else {
            if (typeof r === 'string' || this._strokeColor.type !== this.settings.color.type) {
                this._strokeColor = new this.settings.color(r, g, b, a);
            } else {
                this._strokeColor.set(r, g, b, a);
            }
            this._doStroke = true;
        }
        return this;
    },
    fill: function fill(r, g, b, a) {
        if (typeof r === 'undefined') {
            this._fill();
        } else if (typeof r === 'boolean') {
            this._doFill = r;
        } else {
            if (typeof r === 'string' || this._fillColor.type !== this.settings.color.type) {
                this._fillColor = new this.settings.color(r, g, b, a);
            } else {
                this._fillColor.set(r, g, b, a);
            }
            this._doFill = true;
        }
        return this;
    },
    setTransform: function setTransform(m11, m12, m21, m22, dx, dy) {
        var position, zoom;
        if (typeof m11 === 'object' && m11 !== null) {
            position = m11.position;
            zoom = m11.zoom;
            this.matrix.setTransform(zoom, 0, 0, zoom, position[0] * zoom, position[1] * zoom);
        } else {
            this.matrix.setTransform(m11, m12, m21, m22, dx, dy);
        }
        return this;
    },
    backgroundPositionX: function backgroundPositionX(value, type) {
        if (typeof type !== 'undefined' && type !== constants.get('VALUE')) {
            if (type === constants.get('CONSTANT')) {
                type = constants.get('PERCENTAGES');
                if (value === constants.get('LEFT')) {
                    value = 0;
                } else if (value === constants.get('CENTER')) {
                    value = 0.5;
                } else if (value === constants.get('RIGHT')) {
                    value = 1;
                } else {
                    throw Error('Got unknown value. The known are: ' + 'LEFT' + ', ' + 'CENTER' + ', ' + 'RIGHT');
                }
            }
            if (type === constants.get('PERCENTAGES')) {
                value *= this.w;
            } else {
                throw Error('Got unknown `value` type. The known are: VALUE, PERCENTAGES, CONSTANT');
            }
        }
        this._backgroundPositionX = value;
        return this;
    },
    backgroundPositionY: function backgroundPositionY(value, type) {
        if (typeof type !== 'undefined' && type !== constants.get('VALUE')) {
            if (type === constants.get('CONSTANT')) {
                type = constants.get('PERCENTAGES');
                if (value === constants.get('LEFT')) {
                    value = 0;
                } else if (value === constants.get('CENTER')) {
                    value = 0.5;
                } else if (value === constants.get('RIGHT')) {
                    value = 1;
                } else {
                    throw Error('Got unknown value. The known are: ' + 'TOP' + ', ' + 'MIDDLE' + ', ' + 'BOTTOM');
                }
            }
            if (type === constants.get('PERCENTAGES')) {
                value *= this.h;
            } else {
                throw Error('Got unknown `value` type. The known are: VALUE, PERCENTAGES, CONSTANT');
            }
        }
        this._backgroundPositionX = value;
        return this;
    },
    image: function image(image, x, y, w, h) {
        if (image.get().loaded) {
            if (typeof w === 'undefined') {
                w = image.dw;
            }
            if (typeof h === 'undefined') {
                h = image.dh;
            }
            this.drawImage(image, align(x, w, this._rectAlignX), align(y, h, this._rectAlignY), w, h);
        }
        return this;
    },
    closeShape: function closeShape() {
        this._closeShape = true;
        return this;
    },
    beginShape: function beginShape(options) {
        if (!options) {
            options = {};
        }
        this._vertices.length = 0;
        if (typeof options.type === 'undefined') {
            this._shapeType = null;
        } else {
            this._shapeType = options.type;
        }
        return this;
    },
    vertex: function vertex(x, y) {
        this._vertices.push(Math.floor(x), Math.floor(y));
        return this;
    },
    endShape: function endShape() {
        throw Error('not impemented now');
    },
    transform: function transform(m11, m12, m21, m22, dx, dy) {
        this.matrix.transform(m11, m12, m21, m22, dx, dy);
        return this;
    },
    translate: function translate(x, y) {
        this.matrix.translate(x, y);
        return this;
    },
    restore: function restore() {
        this.matrix.restore();
        return this;
    },
    save: function save() {
        this.matrix.save();
        return this;
    },
    scale: function scale(x, y) {
        this.matrix.scale(x, y);
        return this;
    },
    constructor: AbstractRenderer
};
AbstractRenderer.create = function create(self, options, type) {
    var context;
    if (options.canvas) {
        self.canvas = options.canvas;
    } else {
        self.canvas = document.createElement('canvas');
        self.canvas.innerHTML = 'Unable to run this application.';
    }
    if (type === constants.get('2D')) {
        context = '2d';
    } else if (type !== constants.get('GL')) {
        throw Error('Got unknown renderer type. The known are: `2D` and `GL`');
    } else if (!(context = getWebGL())) {
        throw Error('Cannot get WebGL context. Try to use `2D` as the renderer type or `v6.Renderer2D` instead of `v6.RendererGL`');
    }
    self.context = self.canvas.getContext(context, { alpha: options.alpha });
    self.settings = options.settings;
    self.type = type;
    self._stack = [];
    self._stackIndex = -1;
    self._vertices = [];
    if (typeof options.appendTo === 'undefined') {
        self.appendTo(document.body);
    } else if (options.appendTo !== null) {
        self.appendTo(options.appendTo);
    }
    if ('w' in options || 'h' in options) {
        self.resize(options.w || 0, options.h || 0);
    } else if (options.appendTo !== null) {
        self.resizeTo(options.appendTo || document.body);
    } else {
        self.resize(600, 400);
    }
    setDefaultDrawingSettings(self, self);
};
module.exports = AbstractRenderer;
},{"../constants":9,"../internal/create_polygon":13,"../internal/polygons":16,"./internal/align":26,"./internal/copy_drawing_settings":27,"./internal/get_webgl":30,"./internal/set_default_drawing_settings":31,"./settings":32,"peako/get-element-h":63,"peako/get-element-w":64}],23:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var constants = require('../constants');
var align = require('./internal/align');
var AbstractRenderer = require('./AbstractRenderer');
var options_ = require('./settings');
function Renderer2D(options) {
    AbstractRenderer.create(this, options = defaults(options_, options), constants.get('2D'));
    this.matrix = this.context;
}
Renderer2D.prototype = Object.create(AbstractRenderer.prototype);
Renderer2D.prototype.constructor = Renderer2D;
Renderer2D.prototype.backgroundColor = function backgroundColor(r, g, b, a) {
    var settings = this.settings;
    var context = this.context;
    context.save();
    context.fillStyle = new settings.color(r, g, b, a);
    context.setTransform(settings.scale, 0, 0, settings.scale, 0, 0);
    context.fillRect(0, 0, this.w, this.h);
    context.restore();
    return this;
};
Renderer2D.prototype.backgroundImage = function backgroundImage(image) {
    var _rectAlignX = this._rectAlignX;
    var _rectAlignY = this._rectAlignY;
    this._rectAlignX = constants.get('CENTER');
    this._rectAlignY = constants.get('MIDDLE');
    this.image(image, this.w * 0.5, this.h * 0.5);
    this._rectAlignX = _rectAlignX;
    this._rectAlignY = _rectAlignY;
    return this;
};
Renderer2D.prototype.clear = function clear() {
    this.context.clear(0, 0, this.w, this.h);
    return this;
};
Renderer2D.prototype.drawArrays = function drawArrays(verts, count, _mode, _sx, _sy) {
    var context = this.context;
    var i;
    if (count < 2) {
        return this;
    }
    if (typeof _sx === 'undefined') {
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
Renderer2D.prototype.drawImage = function drawImage(image, x, y, w, h) {
    this.context.drawImage(image.get().image, image.x, image.y, image.w, image.h, x, y, w, h);
    return this;
};
Renderer2D.prototype.rect = function rect(x, y, w, h) {
    x = Math.floor(align(x, w, this._rectAlignX));
    y = Math.floor(align(y, h, this._rectAlignY));
    this.context.beginPath();
    this.context.rect(x, y, w, h);
    if (this._doFill) {
        this._fill();
    }
    if (this._doStroke) {
        this._stroke();
    }
    return this;
};
Renderer2D.prototype.arc = function arc(x, y, r) {
    this.context.beginPath();
    this.context.arc(x, y, r, 0, Math.PI * 2);
    if (this._doFill) {
        this._fill();
    }
    if (this._doStroke) {
        this._stroke(true);
    }
    return this;
};
Renderer2D.prototype._fill = function _fill() {
    this.context.fillStyle = this._fillColor;
    this.context.fill();
};
Renderer2D.prototype._stroke = function (close) {
    var context = this.context;
    if (close) {
        context.closePath();
    }
    context.strokeStyle = this._strokeColor;
    if ((context.lineWidth = this._lineWidth) <= 1) {
        context.stroke();
    }
    context.stroke();
};
module.exports = Renderer2D;
},{"../constants":9,"./AbstractRenderer":22,"./internal/align":26,"./settings":32,"peako/defaults":60}],24:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var ShaderProgram = require('../ShaderProgram');
var Transform = require('../Transform');
var constants = require('../constants');
var shaders = require('../shaders');
var align = require('./internal/align');
var AbstractRenderer = require('./AbstractRenderer');
var options_ = require('./settings');
var square = function () {
        var square = [
                0,
                0,
                1,
                0,
                1,
                1,
                0,
                1
            ];
        if (typeof Float32Array === 'function') {
            return new Float32Array(square);
        }
        return square;
    }();
function RendererGL(options) {
    AbstractRenderer.create(this, options = defaults(options_, options), constants.get('GL'));
    this.matrix = new Transform();
    this.buffers = {
        default: this.context.createBuffer(),
        square: this.context.createBuffer()
    };
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.buffers.square);
    this.context.bufferData(this.context.ARRAY_BUFFER, square, this.context.STATIC_DRAW);
    this.programs = { default: new ShaderProgram(shaders.basic, this.context) };
    this.blending(options.blending);
}
RendererGL.prototype = Object.create(AbstractRenderer.prototype);
RendererGL.prototype.constructor = RendererGL;
RendererGL.prototype.resize = function resize(w, h) {
    AbstractRenderer.prototype.resize.call(this, w, h);
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
RendererGL.prototype._clear = function _clear(r, g, b, a) {
    var gl = this.context;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
RendererGL.prototype.backgroundColor = function backgroundColor(r, g, b, a) {
    var rgba = new this.settings.color(r, g, b, a).rgba();
    this._clear(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]);
    return this;
};
RendererGL.prototype.clear = function clear() {
    this._clear(0, 0, 0, 0);
    return this;
};
RendererGL.prototype.drawArrays = function drawArrays(verts, count, mode, _sx, _sy) {
    var program = this.programs.default;
    var gl = this.context;
    if (count < 2) {
        return this;
    }
    if (verts) {
        if (typeof mode === 'undefined') {
            mode = gl.STATIC_DRAW;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.default);
        gl.bufferData(gl.ARRAY_BUFFER, verts, mode);
    }
    if (typeof _sx !== 'undefined') {
        this.matrix.scale(_sx, _sy);
    }
    program.use().setUniform('utransform', this.matrix.matrix).setUniform('ures', [
        this.w,
        this.h
    ]).pointer('apos', 2, gl.FLOAT, false, 0, 0);
    this._fill(count);
    this._stroke(count);
    return this;
};
RendererGL.prototype._fill = function _fill(count) {
    if (this._doFill) {
        this.programs.default.setUniform('ucolor', this._fillColor.rgba());
        this.context.drawArrays(this.context.TRIANGLE_FAN, 0, count);
    }
};
RendererGL.prototype._stroke = function _stroke(count) {
    if (this._doStroke && this._lineWidth > 0) {
        this.programs.default.setUniform('ucolor', this._strokeColor.rgba());
        this.context.lineWidth(this._lineWidth);
        this.context.drawArrays(this.context.LINE_LOOP, 0, count);
    }
};
RendererGL.prototype.arc = function arc(x, y, r) {
    return this._polygon(x, y, r, r, 24, 0);
};
RendererGL.prototype.rect = function rect(x, y, w, h) {
    var alignedX = align(x, w, this._rectAlignX);
    var alignedY = align(y, h, this._rectAlignY);
    this.matrix.save();
    this.matrix.translate(alignedX, alignedY);
    this.matrix.scale(w, h);
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.buffers.rect);
    this.drawArrays(null, 4);
    this.matrix.restore();
    return this;
};
module.exports = RendererGL;
},{"../ShaderProgram":2,"../Transform":4,"../constants":9,"../shaders":34,"./AbstractRenderer":22,"./internal/align":26,"./settings":32,"peako/defaults":60}],25:[function(require,module,exports){
'use strict';
var constants = require('../constants');
var report = require('../internal/report');
var getRendererType = require('./internal/get_renderer_type');
var getWebGL = require('./internal/get_webgl');
var RendererGL = require('./RendererGL');
var Renderer2D = require('./Renderer2D');
var type = require('./settings').type;
function createRenderer(options) {
    var type_ = options && options.type || type;
    if (type_ === constants.get('AUTO')) {
        type_ = getRendererType();
    }
    if (type_ === constants.get('GL')) {
        if (getWebGL()) {
            return new RendererGL(options);
        }
        report('Cannot create WebGL context. Falling back to 2D.');
    }
    if (type_ === constants.get('2D') || type_ === constants.get('GL')) {
        return new Renderer2D(options);
    }
    throw Error('Got unknown renderer type. The known are: `2D` and `GL`');
}
module.exports = createRenderer;
},{"../constants":9,"../internal/report":17,"./Renderer2D":23,"./RendererGL":24,"./internal/get_renderer_type":29,"./internal/get_webgl":30,"./settings":32}],26:[function(require,module,exports){
'use strict';
var constants = require('../../constants');
function align(value, width, constant) {
    switch (constant) {
    case constants.get('LEFT'):
    case constants.get('TOP'):
        return value;
    case constants.get('CENTER'):
    case constants.get('MIDDLE'):
        return value - width * 0.5;
    case constants.get('RIGHT'):
    case constants.get('BOTTOM'):
        return value - width;
    }
    throw Error('Got unknown alignment constant. The known are: `LEFT`, `CENTER`, `RIGHT`, `TOP`, `MIDDLE`, and `BOTTOM`');
}
module.exports = align;
},{"../../constants":9}],27:[function(require,module,exports){
'use strict';
function copyDrawingSettings(target, source, deep) {
    if (deep) {
        target._fillColor[0] = source._fillColor[0];
        target._fillColor[1] = source._fillColor[1];
        target._fillColor[2] = source._fillColor[2];
        target._fillColor[3] = source._fillColor[3];
        target._strokeColor[0] = source._strokeColor[0];
        target._strokeColor[1] = source._strokeColor[1];
        target._strokeColor[2] = source._strokeColor[2];
        target._strokeColor[3] = source._strokeColor[3];
    }
    target._rectAlignX = source._rectAlignX;
    target._rectAlignY = source._rectAlignY;
    target._lineWidth = source._lineWidth;
    target._doStroke = source._doStroke;
    target._doFill = source._doFill;
    return target;
}
module.exports = copyDrawingSettings;
},{}],28:[function(require,module,exports){
'use strict';
var constants = require('../../constants');
var defaultDrawingSettings = {
        _rectAlignX: constants.get('LEFT'),
        _rectAlignY: constants.get('TOP'),
        _lineWidth: 2,
        _doStroke: true,
        _doFill: true
    };
module.exports = defaultDrawingSettings;
},{"../../constants":9}],29:[function(require,module,exports){
'use strict';
var once = require('peako/once');
var constants = require('../../constants');
if (typeof platform === 'undefined') {
    var platform;
    try {
        platform = require('platform');
    } catch (error) {
    }
}
function getRendererType() {
    var safari, touchable;
    if (platform) {
        safari = platform.os && platform.os.family === 'iOS' && platform.name === 'Safari';
    }
    if (typeof window !== 'undefined') {
        touchable = 'ontouchend' in window;
    }
    if (touchable && !safari) {
        return constants.get('GL');
    }
    return constants.get('2D');
}
module.exports = once(getRendererType);
},{"../../constants":9,"peako/once":84,"platform":"platform"}],30:[function(require,module,exports){
'use strict';
var once = require('peako/once');
function getWebGL() {
    var canvas = document.createElement('canvas');
    var name = null;
    if (canvas.getContext('webgl')) {
        name = 'webgl';
    } else if (canvas.getContext('experimental-webgl')) {
        name = 'experimental-webgl';
    }
    canvas = null;
    return name;
}
module.exports = once(getWebGL);
},{"peako/once":84}],31:[function(require,module,exports){
'use strict';
var defaultDrawingSettings = require('./default_drawing_settings');
var copyDrawingSettings = require('./copy_drawing_settings');
function setDefaultDrawingSettings(target, renderer) {
    copyDrawingSettings(target, defaultDrawingSettings);
    target._strokeColor = new renderer.settings.color();
    target._fillColor = new renderer.settings.color();
    return target;
}
module.exports = setDefaultDrawingSettings;
},{"./copy_drawing_settings":27,"./default_drawing_settings":28}],32:[function(require,module,exports){
'use strict';
var color = require('../color/RGBA');
var type = require('../constants').get('2D');
var options = {
        settings: {
            color: color,
            scale: 1
        },
        antialias: true,
        blending: true,
        degrees: false,
        alpha: true,
        type: type
    };
module.exports = options;
},{"../color/RGBA":6,"../constants":9}],33:[function(require,module,exports){
'use strict';
module.exports = { degress: false };
},{}],34:[function(require,module,exports){
'use strict';
var shaders = {
        basic: {
            vert: 'precision mediump float;attribute vec2 apos;uniform vec2 ures;uniform mat3 utransform;void main(){gl_Position=vec4(((utransform*vec3(apos,1.0)).xy/ures*2.0-1.0)*vec2(1,-1),0,1);}',
            frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=vec4(ucolor.rgb/255.0,ucolor.a);}'
        },
        background: {
            vert: 'precision mediump float;attribute vec2 apos;void main(){gl_Position = vec4(apos,0,1);}',
            frag: 'precision mediump float;uniform vec4 ucolor;void main(){gl_FragColor=ucolor;}'
        }
    };
module.exports = shaders;
},{}],35:[function(require,module,exports){
'use strict';
exports.AbstractImage = require('./core/image/AbstractImage');
exports.AbstractRenderer = require('./core/renderer/AbstractRenderer');
exports.AbstractVector = require('./core/math/AbstractVector');
exports.Camera = require('./core/Camera');
exports.CompoundedImage = require('./core/image/CompoundedImage');
exports.HSLA = require('./core/color/HSLA');
exports.Image = require('./core/image/Image');
exports.RGBA = require('./core/color/RGBA');
exports.Renderer2D = require('./core/renderer/Renderer2D');
exports.RendererGL = require('./core/renderer/RendererGL');
exports.ShaderProgram = require('./core/ShaderProgram');
exports.Ticker = require('./core/Ticker');
exports.Transform = require('./core/Transform');
exports.Vector2D = require('./core/math/Vector2D');
exports.Vector3D = require('./core/math/Vector3D');
exports.constants = require('./core/constants');
exports.createRenderer = require('./core/renderer');
exports.options = require('./core/renderer/settings');
exports.settings = require('./core/settings');
exports.shaders = require('./core/shaders');
if (typeof self !== 'undefined') {
    self.v6 = exports;
}
},{"./core/Camera":1,"./core/ShaderProgram":2,"./core/Ticker":3,"./core/Transform":4,"./core/color/HSLA":5,"./core/color/RGBA":6,"./core/constants":9,"./core/image/AbstractImage":10,"./core/image/CompoundedImage":11,"./core/image/Image":12,"./core/math/AbstractVector":19,"./core/math/Vector2D":20,"./core/math/Vector3D":21,"./core/renderer":25,"./core/renderer/AbstractRenderer":22,"./core/renderer/Renderer2D":23,"./core/renderer/RendererGL":24,"./core/renderer/settings":32,"./core/settings":33,"./core/shaders":34}],36:[function(require,module,exports){
'use strict';

/**
 * A lightweight implementation of Node.js EventEmitter.
 * @constructor LightEmitter
 * @example
 * var LightEmitter = require( 'light_emitter' );
 */
function LightEmitter () {}

LightEmitter.prototype = {
  /**
   * @method LightEmitter#emit
   * @param {string} type
   * @param {...any} [data]
   * @chainable
   */
  emit: function emit ( type ) {
    var list = _getList( this, type );
    var data, i, l;

    if ( ! list ) {
      return this;
    }

    if ( arguments.length > 1 ) {
      data = [].slice.call( arguments, 1 );
    }

    for ( i = 0, l = list.length; i < l; ++i ) {
      if ( ! list[ i ].active ) {
        continue;
      }

      if ( list[ i ].once ) {
        list[ i ].active = false;
      }

      if ( data ) {
        list[ i ].listener.apply( this, data );
      } else {
        list[ i ].listener.call( this );
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#off
   * @param {string}   [type]
   * @param {function} [listener]
   * @chainable
   */
  off: function off ( type, listener ) {
    var list, i;

    if ( ! type ) {
      this._events = null;
    } else if ( ( list = _getList( this, type ) ) ) {
      if ( listener ) {
        for ( i = list.length - 1; i >= 0; --i ) {
          if ( list[ i ].listener === listener && list[ i ].active ) {
            list[ i ].active = false;
          }
        }
      } else {
        list.length = 0;
      }
    }

    return this;
  },

  /**
   * @method LightEmitter#on
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  on: function on ( type, listener ) {
    _on( this, type, listener );
    return this;
  },

  /**
   * @method LightEmitter#once
   * @param {string}   type
   * @param {function} listener
   * @chainable
   */
  once: function once ( type, listener ) {
    _on( this, type, listener, true );
    return this;
  },

  constructor: LightEmitter
};

/**
 * @private
 * @method _on
 * @param  {LightEmitter} self
 * @param  {string}       type
 * @param  {function}     listener
 * @param  {boolean}      once
 * @return {void}
 */
function _on ( self, type, listener, once ) {
  var entity = {
    listener: listener,
    active:   true,
    type:     type,
    once:     once
  };

  if ( ! self._events ) {
    self._events = Object.create( null );
  }

  if ( ! self._events[ type ] ) {
    self._events[ type ] = [];
  }

  self._events[ type ].push( entity );
}

/**
 * @private
 * @method _getList
 * @param  {LightEmitter}   self
 * @param  {string}         type
 * @return {array<object>?}
 */
function _getList ( self, type ) {
  return self._events && self._events[ type ];
}

module.exports = LightEmitter;

},{}],37:[function(require,module,exports){
'use strict';
var toString = Object.prototype.toString;
module.exports = function _throwArgumentException(unexpected, expected) {
    throw Error('"' + toString.call(unexpected) + '" is not ' + expected);
};
},{}],38:[function(require,module,exports){
'use strict';
var type = require('./type');
var lastRes = 'undefined';
var lastVal;
module.exports = function _type(val) {
    if (val === lastVal) {
        return lastRes;
    }
    return lastRes = type(lastVal = val);
};
},{"./type":93}],39:[function(require,module,exports){
'use strict';
module.exports = function _unescape(string) {
    return string.replace(/\\(\\)?/g, '$1');
};
},{}],40:[function(require,module,exports){
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
},{"../isset":77}],41:[function(require,module,exports){
'use strict';
module.exports = function baseExec(regexp, string) {
    var result = [], value;
    regexp.lastIndex = 0;
    while (value = regexp.exec(string)) {
        result.push(value);
    }
    return result;
};
},{}],42:[function(require,module,exports){
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
},{"../call-iteratee":50,"../isset":77}],43:[function(require,module,exports){
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
},{"../call-iteratee":50}],44:[function(require,module,exports){
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
},{"../isset":77}],45:[function(require,module,exports){
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
},{"./base-to-index":48}],46:[function(require,module,exports){
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
},{"../support/support-keys":88,"./base-index-of":45}],47:[function(require,module,exports){
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
},{"./base-get":44}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
'use strict';
var _throwArgumentException = require('./_throw-argument-exception');
var defaultTo = require('./default-to');
module.exports = function before(n, fn) {
    var value;
    if (typeof fn !== 'function') {
        _throwArgumentException(fn, 'a function');
    }
    n = defaultTo(n, 1);
    return function () {
        if (--n >= 0) {
            value = fn.apply(this, arguments);
        }
        return value;
    };
};
},{"./_throw-argument-exception":37,"./default-to":59}],50:[function(require,module,exports){
'use strict';
module.exports = function callIteratee(fn, ctx, val, key, obj) {
    if (typeof ctx === 'undefined') {
        return fn(val, key, obj);
    }
    return fn.call(ctx, val, key, obj);
};
},{}],51:[function(require,module,exports){
'use strict';
var baseExec = require('./base/base-exec'), _unescape = require('./_unescape'), isKey = require('./is-key'), toKey = require('./to-key'), _type = require('./_type');
var rProperty = /(^|\.)\s*([_a-z]\w*)\s*|\[\s*((?:-)?(?:\d+|\d*\.\d+)|("|')(([^\\]\\(\\\\)*|[^\4])*)\4)\s*\]/gi;
function stringToPath(str) {
    var path = baseExec(rProperty, str), i = path.length - 1, val;
    for (; i >= 0; --i) {
        val = path[i];
        if (val[2]) {
            path[i] = val[2];
        } else if (val[5] != null) {
            path[i] = _unescape(val[5]);
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
},{"./_type":38,"./_unescape":39,"./base/base-exec":41,"./is-key":69,"./to-key":91}],52:[function(require,module,exports){
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
},{}],53:[function(require,module,exports){
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
},{"./create":55,"./each":62,"./get-prototype-of":65,"./is-object-like":71,"./to-object":92}],54:[function(require,module,exports){
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
    DEEP_KEEP_FN: 2,
    PLACEHOLDER: {}
};
},{}],55:[function(require,module,exports){
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
},{"./define-properties":61,"./is-primitive":74,"./set-prototype-of":86}],56:[function(require,module,exports){
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
},{"../base/base-for-each":42,"../base/base-for-in":43,"../is-array-like":67,"../iteratee":78,"../keys":79,"../to-object":92}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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
},{"../cast-path":51,"../noop":82}],59:[function(require,module,exports){
'use strict';
module.exports = function defaultTo(value, defaultValue) {
    if (value != null && value === value) {
        return value;
    }
    return defaultValue;
};
},{}],60:[function(require,module,exports){
'use strict';
var mixin = require('./mixin'), clone = require('./clone');
module.exports = function defaults(defaults, object) {
    if (object == null) {
        return clone(true, defaults);
    }
    return mixin(true, clone(true, defaults), object);
};
},{"./clone":53,"./mixin":81}],61:[function(require,module,exports){
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
},{"./base/base-define-property":40,"./each":62,"./is-primitive":74,"./support/support-define-property":87}],62:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-each')();
},{"./create/create-each":56}],63:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Height');
},{"./create/create-get-element-dimension":57}],64:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-get-element-dimension')('Width');
},{"./create/create-get-element-dimension":57}],65:[function(require,module,exports){
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
},{"./constants":54}],66:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length'), isWindowLike = require('./is-window-like');
module.exports = function isArrayLikeObject(value) {
    return isObjectLike(value) && isLength(value.length) && !isWindowLike(value);
};
},{"./is-length":70,"./is-object-like":71,"./is-window-like":76}],67:[function(require,module,exports){
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
},{"./is-length":70,"./is-window-like":76}],68:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like'), isLength = require('./is-length');
var toString = {}.toString;
module.exports = Array.isArray || function isArray(value) {
    return isObjectLike(value) && isLength(value.length) && toString.call(value) === '[object Array]';
};
},{"./is-length":70,"./is-object-like":71}],69:[function(require,module,exports){
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
},{"./_type":38}],70:[function(require,module,exports){
'use strict';
var MAX_ARRAY_LENGTH = require('./constants').MAX_ARRAY_LENGTH;
module.exports = function isLength(value) {
    return typeof value === 'number' && value >= 0 && value <= MAX_ARRAY_LENGTH && value % 1 === 0;
};
},{"./constants":54}],71:[function(require,module,exports){
'use strict';
module.exports = function isObjectLike(value) {
    return !!value && typeof value === 'object';
};
},{}],72:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
var toString = {}.toString;
module.exports = function isObject(value) {
    return isObjectLike(value) && toString.call(value) === '[object Object]';
};
},{"./is-object-like":71}],73:[function(require,module,exports){
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
},{"./get-prototype-of":65,"./is-object":72}],74:[function(require,module,exports){
'use strict';
module.exports = function isPrimitive(value) {
    return !value || typeof value !== 'object' && typeof value !== 'function';
};
},{}],75:[function(require,module,exports){
'use strict';
var type = require('./type');
module.exports = function isSymbol(value) {
    return type(value) === 'symbol';
};
},{"./type":93}],76:[function(require,module,exports){
'use strict';
var isObjectLike = require('./is-object-like');
module.exports = function isWindowLike(value) {
    return isObjectLike(value) && value.window === value;
};
},{"./is-object-like":71}],77:[function(require,module,exports){
'use strict';
module.exports = function isset(key, obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[key] !== 'undefined' || key in obj;
};
},{}],78:[function(require,module,exports){
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
},{"./is-array-like-object":66,"./matches-property":80,"./property":85}],79:[function(require,module,exports){
'use strict';
var baseKeys = require('./base/base-keys');
var toObject = require('./to-object');
var support = require('./support/support-keys');
if (support !== 'es2015') {
    module.exports = function keys(v) {
        var _keys;
        if (support === 'es5') {
            _keys = Object.keys;
        } else {
            _keys = baseKeys;
        }
        return _keys(toObject(v));
    };
} else {
    module.exports = Object.keys;
}
},{"./base/base-keys":46,"./support/support-keys":88,"./to-object":92}],80:[function(require,module,exports){
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
},{"./base/base-get":44,"./cast-path":51,"./constants":54}],81:[function(require,module,exports){
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
},{"./is-array":68,"./is-plain-object":73,"./keys":79,"./to-object":92}],82:[function(require,module,exports){
'use strict';
module.exports = function noop() {
};
},{}],83:[function(require,module,exports){
'use strict';
module.exports = Date.now || function now() {
    return new Date().getTime();
};
},{}],84:[function(require,module,exports){
'use strict';
var before = require('./before');
module.exports = function once(target) {
    return before(1, target);
};
},{"./before":49}],85:[function(require,module,exports){
'use strict';
module.exports = require('./create/create-property')(require('./base/base-property'));
},{"./base/base-property":47,"./create/create-property":58}],86:[function(require,module,exports){
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
},{"./constants":54,"./is-primitive":74}],87:[function(require,module,exports){
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
},{}],88:[function(require,module,exports){
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
},{}],89:[function(require,module,exports){
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
},{"./timestamp":90}],90:[function(require,module,exports){
'use strict';
var now = require('./now');
var navigatorStart;
if (typeof performance === 'undefined' || !performance.now) {
    navigatorStart = now();
    module.exports = function timestamp() {
        return now() - navigatorStart;
    };
} else {
    module.exports = function timestamp() {
        return performance.now();
    };
}
},{"./now":83}],91:[function(require,module,exports){
'use strict';
var _unescape = require('./_unescape'), isSymbol = require('./is-symbol');
module.exports = function toKey(val) {
    var key;
    if (typeof val === 'string') {
        return _unescape(val);
    }
    if (isSymbol(val)) {
        return val;
    }
    key = '' + val;
    if (key === '0' && 1 / val === -Infinity) {
        return '-0';
    }
    return _unescape(key);
};
},{"./_unescape":39,"./is-symbol":75}],92:[function(require,module,exports){
'use strict';
var ERR = require('./constants').ERR;
module.exports = function toObject(value) {
    if (value == null) {
        throw TypeError(ERR.UNDEFINED_OR_NULL);
    }
    return Object(value);
};
},{"./constants":54}],93:[function(require,module,exports){
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
},{"./create":55}]},{},[35]);
