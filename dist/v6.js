(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./internal/create_program":14,"./internal/create_shader":15}],2:[function(require,module,exports){
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
},{"light_emitter":36,"peako/timer":89,"peako/timestamp":90}],3:[function(require,module,exports){
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
},{"./mat3":18}],4:[function(require,module,exports){
'use strict';
var defaultTo = require('peako/default-to');
var Vector2D = require('../math/Vector2D');
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
},{"../math/Vector2D":20,"peako/default-to":59}],5:[function(require,module,exports){
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
    'BOTTOM',
    'PERCENT'
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
var processRectAlignX = require('./internal/process_rect_align').processRectAlignX;
var processRectAlignY = require('./internal/process_rect_align').processRectAlignY;
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
    drawPolygon: function drawPolygon(x, y, xRadius, yRadius, sides, rotationAngle, degrees) {
        var polygon = polygons[sides];
        if (!polygon) {
            polygon = polygons[sides] = createPolygon(sides);
        }
        if (degrees) {
            rotationAngle *= Math.PI / 180;
        }
        this.matrix.save();
        this.matrix.translate(x, y);
        this.matrix.rotate(rotationAngle);
        this.drawArrays(polygon, polygon.length * 0.5, null, xRadius, yRadius);
        this.matrix.restore();
        return this;
    },
    polygon: function polygon(x, y, r, sides, rotationAngle) {
        if (sides % 1) {
            sides = Math.floor(sides * 100) * 0.01;
        }
        if (typeof rotationAngle === 'undefined') {
            this.drawPolygon(x, y, r, r, sides, -Math.PI * 0.5);
        } else {
            this.drawPolygon(x, y, r, r, sides, rotationAngle, options.degrees);
        }
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
            x = processRectAlignX(this, x, w);
            x = processRectAlignY(this, y, h);
            this.drawImage(image, x, y, w, h);
        }
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
    save: function save() {
        this.matrix.save();
        return this;
    },
    restore: function restore() {
        this.matrix.restore();
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
    translate: function translate(x, y) {
        this.matrix.translate(x, y);
        return this;
    },
    rotate: function rotate(angle) {
        this.matrix.rotate(angle);
        return this;
    },
    scale: function scale(x, y) {
        this.matrix.scale(x, y);
        return this;
    },
    transform: function transform(m11, m12, m21, m22, dx, dy) {
        this.matrix.transform(m11, m12, m21, m22, dx, dy);
        return this;
    },
    lineWidth: function lineWidth(number) {
        this._lineWidth = number;
        return this;
    },
    backgroundPositionX: function backgroundPositionX(value, type) {
        if (typeof type !== 'undefined' && type !== constants.get('VALUE')) {
            if (type === constants.get('CONSTANT')) {
                type = constants.get('PERCENT');
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
            if (type === constants.get('PERCENT')) {
                value *= this.w;
            } else {
                throw Error('Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT');
            }
        }
        this._backgroundPositionX = value;
        return this;
    },
    backgroundPositionY: function backgroundPositionY(value, type) {
        if (typeof type !== 'undefined' && type !== constants.get('VALUE')) {
            if (type === constants.get('CONSTANT')) {
                type = constants.get('PERCENT');
                if (value === constants.get('TOP')) {
                    value = 0;
                } else if (value === constants.get('MIDDLE')) {
                    value = 0.5;
                } else if (value === constants.get('BOTTOM')) {
                    value = 1;
                } else {
                    throw Error('Got unknown value. The known are: ' + 'TOP' + ', ' + 'MIDDLE' + ', ' + 'BOTTOM');
                }
            }
            if (type === constants.get('PERCENT')) {
                value *= this.h;
            } else {
                throw Error('Got unknown `value` type. The known are: VALUE, PERCENT, CONSTANT');
            }
        }
        this._backgroundPositionY = value;
        return this;
    },
    rectAlignX: function rectAlignX(value) {
        if (value === constants.get('LEFT') || value === constants.get('CENTER') || value === constants.get('RIGHT')) {
            this._rectAlignX = value;
        } else {
            throw Error('Got unknown `rectAlign` constant. The known are: ' + 'LEFT' + ', ' + 'CENTER' + ', ' + 'RIGHT');
        }
        return this;
    },
    rectAlignY: function rectAlignY(value) {
        if (value === constants.get('LEFT') || value === constants.get('CENTER') || value === constants.get('RIGHT')) {
            this._rectAlignY = value;
        } else {
            throw Error('Got unknown `rectAlign` constant. The known are: ' + 'TOP' + ', ' + 'MIDDLE' + ', ' + 'BOTTOM');
        }
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
    noStroke: function noStroke() {
        this._doStroke = false;
        return this;
    },
    noFill: function noFill() {
        this._doFill = false;
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
        throw Error('Got unknown renderer type. The known are: 2D and GL');
    } else if (!(context = getWebGL())) {
        throw Error('Cannot get WebGL context. Try to use 2D as the renderer type or v6.Renderer2D instead of v6.RendererGL');
    }
    self.context = self.canvas.getContext(context, { alpha: options.alpha });
    self.settings = options.settings;
    self.type = type;
    self._stack = [];
    self._stackIndex = -1;
    self._vertices = [];
    self._shapeType = null;
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
},{"../constants":9,"../internal/create_polygon":13,"../internal/polygons":16,"./internal/copy_drawing_settings":26,"./internal/get_webgl":29,"./internal/process_rect_align":30,"./internal/set_default_drawing_settings":31,"./settings":32,"peako/get-element-h":63,"peako/get-element-w":64}],23:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var constants = require('../constants');
var processRectAlignX = require('./internal/process_rect_align').processRectAlignX;
var processRectAlignY = require('./internal/process_rect_align').processRectAlignY;
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
    x = processRectAlignX(this, x, w);
    y = processRectAlignY(this, y, h);
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
},{"../constants":9,"./AbstractRenderer":22,"./internal/process_rect_align":30,"./settings":32,"peako/defaults":60}],24:[function(require,module,exports){
'use strict';
var defaults = require('peako/defaults');
var ShaderProgram = require('../ShaderProgram');
var Transform = require('../Transform');
var constants = require('../constants');
var shaders = require('../shaders');
var processRectAlignX = require('./internal/process_rect_align').processRectAlignX;
var processRectAlignY = require('./internal/process_rect_align').processRectAlignY;
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
    var alignedX = processRectAlignX(this, x, w);
    var alignedY = processRectAlignY(this, y, h);
    this.matrix.save();
    this.matrix.translate(alignedX, alignedY);
    this.matrix.scale(w, h);
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.buffers.rect);
    this.drawArrays(null, 4);
    this.matrix.restore();
    return this;
};
module.exports = RendererGL;
},{"../ShaderProgram":1,"../Transform":3,"../constants":9,"../shaders":34,"./AbstractRenderer":22,"./internal/process_rect_align":30,"./settings":32,"peako/defaults":60}],25:[function(require,module,exports){
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
    throw Error('Got unknown renderer type. The known are: 2D and GL');
}
module.exports = createRenderer;
},{"../constants":9,"../internal/report":17,"./Renderer2D":23,"./RendererGL":24,"./internal/get_renderer_type":28,"./internal/get_webgl":29,"./settings":32}],26:[function(require,module,exports){
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
    target._backgroundPositionX = source._backgroundPositionX;
    target._backgroundPositionY = source._backgroundPositionY;
    target._rectAlignX = source._rectAlignX;
    target._rectAlignY = source._rectAlignY;
    target._lineWidth = source._lineWidth;
    target._doStroke = source._doStroke;
    target._doFill = source._doFill;
    return target;
}
module.exports = copyDrawingSettings;
},{}],27:[function(require,module,exports){
'use strict';
var constants = require('../../constants');
var defaultDrawingSettings = {
        _backgroundPositionX: constants.get('LEFT'),
        _backgroundPositionY: constants.get('TOP'),
        _rectAlignX: constants.get('LEFT'),
        _rectAlignY: constants.get('TOP'),
        _lineWidth: 2,
        _doStroke: true,
        _doFill: true
    };
module.exports = defaultDrawingSettings;
},{"../../constants":9}],28:[function(require,module,exports){
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
},{"../../constants":9,"peako/once":84,"platform":"platform"}],29:[function(require,module,exports){
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
},{"peako/once":84}],30:[function(require,module,exports){
'use strict';
var constants = require('../../constants');
exports.processRectAlignX = function processRectAlignX(renderer, x, w) {
    if (renderer._rectAlignX === constants.get('CENTER')) {
        x -= w * 0.5;
    } else if (renderer._rectAlignX === constants.get('RIGHT')) {
        x -= w;
    } else if (renderer._rectAlignX !== constants.get('LEFT')) {
        throw Error('Unknown " +' + 'rectAlignX' + '": ' + renderer._rectAlignX);
    }
    return Math.floor(x);
};
exports.processRectAlignY = function processRectAlignY(renderer, x, w) {
    if (renderer._rectAlignY === constants.get('MIDDLE')) {
        x -= w * 0.5;
    } else if (renderer._rectAlignY === constants.get('BOTTOM')) {
        x -= w;
    } else if (renderer._rectAlignY !== constants.get('TOP')) {
        throw Error('Unknown " +' + 'rectAlignY' + '": ' + renderer._rectAlignY);
    }
    return Math.floor(x);
};
},{"../../constants":9}],31:[function(require,module,exports){
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
},{"./copy_drawing_settings":26,"./default_drawing_settings":27}],32:[function(require,module,exports){
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
exports.degress = false;
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
exports.Camera = require('./core/camera/Camera');
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
exports.shaders = require('./core/shaders');
if (typeof self !== 'undefined') {
    self.v6 = exports;
}
},{"./core/ShaderProgram":1,"./core/Ticker":2,"./core/Transform":3,"./core/camera/Camera":4,"./core/color/HSLA":5,"./core/color/RGBA":6,"./core/constants":9,"./core/image/AbstractImage":10,"./core/image/CompoundedImage":11,"./core/image/Image":12,"./core/math/AbstractVector":19,"./core/math/Vector2D":20,"./core/math/Vector3D":21,"./core/renderer":25,"./core/renderer/AbstractRenderer":22,"./core/renderer/Renderer2D":23,"./core/renderer/RendererGL":24,"./core/shaders":34}],36:[function(require,module,exports){
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
},{"./create":55}]},{},[35])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL1NoYWRlclByb2dyYW0uanMiLCJjb3JlL1RpY2tlci5qcyIsImNvcmUvVHJhbnNmb3JtLmpzIiwiY29yZS9jYW1lcmEvQ2FtZXJhLmpzIiwiY29yZS9jb2xvci9IU0xBLmpzIiwiY29yZS9jb2xvci9SR0JBLmpzIiwiY29yZS9jb2xvci9pbnRlcm5hbC9jb2xvcnMuanMiLCJjb3JlL2NvbG9yL2ludGVybmFsL3BhcnNlLmpzIiwiY29yZS9jb25zdGFudHMuanMiLCJjb3JlL2ltYWdlL0Fic3RyYWN0SW1hZ2UuanMiLCJjb3JlL2ltYWdlL0NvbXBvdW5kZWRJbWFnZS5qcyIsImNvcmUvaW1hZ2UvSW1hZ2UuanMiLCJjb3JlL2ludGVybmFsL2NyZWF0ZV9wb2x5Z29uLmpzIiwiY29yZS9pbnRlcm5hbC9jcmVhdGVfcHJvZ3JhbS5qcyIsImNvcmUvaW50ZXJuYWwvY3JlYXRlX3NoYWRlci5qcyIsImNvcmUvaW50ZXJuYWwvcG9seWdvbnMuanMiLCJjb3JlL2ludGVybmFsL3JlcG9ydC5qcyIsImNvcmUvbWF0My5qcyIsImNvcmUvbWF0aC9BYnN0cmFjdFZlY3Rvci5qcyIsImNvcmUvbWF0aC9WZWN0b3IyRC5qcyIsImNvcmUvbWF0aC9WZWN0b3IzRC5qcyIsImNvcmUvcmVuZGVyZXIvQWJzdHJhY3RSZW5kZXJlci5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXIyRC5qcyIsImNvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTC5qcyIsImNvcmUvcmVuZGVyZXIvaW5kZXguanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncy5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9nZXRfcmVuZGVyZXJfdHlwZS5qcyIsImNvcmUvcmVuZGVyZXIvaW50ZXJuYWwvZ2V0X3dlYmdsLmpzIiwiY29yZS9yZW5kZXJlci9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24uanMiLCJjb3JlL3JlbmRlcmVyL2ludGVybmFsL3NldF9kZWZhdWx0X2RyYXdpbmdfc2V0dGluZ3MuanMiLCJjb3JlL3JlbmRlcmVyL3NldHRpbmdzLmpzIiwiY29yZS9zZXR0aW5ncy5qcyIsImNvcmUvc2hhZGVycy5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpZ2h0X2VtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGVha28vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9fdW5lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZXhlYy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZm9yLWVhY2guanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLWZvci1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Jhc2UvYmFzZS1pbmRleC1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2Uta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9iYXNlL2Jhc2UtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcGVha28vYmFzZS9iYXNlLXRvLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2JlZm9yZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jYWxsLWl0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2Nhc3QtcGF0aC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbGFtcC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2NyZWF0ZS9jcmVhdGUtZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9jcmVhdGUvY3JlYXRlLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2RlZmF1bHQtdG8uanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmYXVsdHMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZGVmaW5lLXByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9nZXQtZWxlbWVudC1oLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2dldC1lbGVtZW50LXcuanMiLCJub2RlX21vZHVsZXMvcGVha28vZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXBsYWluLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9pcy1wcmltaXRpdmUuanMiLCJub2RlX21vZHVsZXMvcGVha28vaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzLXdpbmRvdy1saWtlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2lzc2V0LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2l0ZXJhdGVlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL2tleXMuanMiLCJub2RlX21vZHVsZXMvcGVha28vbWF0Y2hlcy1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9taXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9ub29wLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9vbmNlLmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3NldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvcGVha28vc3VwcG9ydC9zdXBwb3J0LWRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby9zdXBwb3J0L3N1cHBvcnQta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lci5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvcGVha28vdG8ta2V5LmpzIiwibm9kZV9tb2R1bGVzL3BlYWtvL3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9wZWFrby90eXBlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNyZWF0ZVByb2dyYW0gPSByZXF1aXJlKCcuL2ludGVybmFsL2NyZWF0ZV9wcm9ncmFtJyk7XG52YXIgY3JlYXRlU2hhZGVyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9jcmVhdGVfc2hhZGVyJyk7XG5mdW5jdGlvbiBTaGFkZXJQcm9ncmFtKHNvdXJjZXMsIGdsKSB7XG4gICAgdmFyIHZlcnQgPSBjcmVhdGVTaGFkZXIoc291cmNlcy52ZXJ0LCBnbC5WRVJURVhfU0hBREVSLCBnbCk7XG4gICAgdmFyIGZyYWcgPSBjcmVhdGVTaGFkZXIoc291cmNlcy5mcmFnLCBnbC5GUkFHTUVOVF9TSEFERVIsIGdsKTtcbiAgICB0aGlzLl9wcm9ncmFtID0gY3JlYXRlUHJvZ3JhbSh2ZXJ0LCBmcmFnLCBnbCk7XG4gICAgdGhpcy5fZ2wgPSBnbDtcbiAgICB0aGlzLl91bmlmb3JtcyA9IHt9O1xuICAgIHRoaXMuX2F0dHJzID0ge307XG4gICAgdGhpcy5fdW5pZm9ybUluZGV4ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLl9wcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICAgIHRoaXMuX2F0dHJJbmRleCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5fcHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xufVxuU2hhZGVyUHJvZ3JhbS5wcm90b3R5cGUgPSB7XG4gICAgdXNlOiBmdW5jdGlvbiB1c2UoKSB7XG4gICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5fcHJvZ3JhbSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0QXR0cjogZnVuY3Rpb24gc2V0QXR0cihuYW1lLCBzaXplLCB0eXBlLCBub3JtYWxpemVkLCBzdHJpZGUsIG9mZnNldCkge1xuICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdldEF0dHIobmFtZSkubG9jYXRpb247XG4gICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2NhdGlvbiwgc2l6ZSwgdHlwZSwgbm9ybWFsaXplZCwgc3RyaWRlLCBvZmZzZXQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldFVuaWZvcm06IGZ1bmN0aW9uIGdldFVuaWZvcm0obmFtZSkge1xuICAgICAgICB2YXIgdW5pZm9ybSA9IHRoaXMuX3VuaWZvcm1zW25hbWVdO1xuICAgICAgICB2YXIgaW5kZXgsIGluZm87XG4gICAgICAgIGlmICh1bmlmb3JtKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5pZm9ybTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoLS10aGlzLl91bmlmb3JtSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgaW5mbyA9IHRoaXMuX2dsLmdldEFjdGl2ZVVuaWZvcm0odGhpcy5fcHJvZ3JhbSwgdGhpcy5fdW5pZm9ybUluZGV4KTtcbiAgICAgICAgICAgIHVuaWZvcm0gPSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb246IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLl9wcm9ncmFtLCBpbmZvLm5hbWUpLFxuICAgICAgICAgICAgICAgIHNpemU6IGluZm8uc2l6ZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBpbmZvLnR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaW5mby5zaXplID4gMSAmJiB+KGluZGV4ID0gaW5mby5uYW1lLmluZGV4T2YoJ1snKSkpIHtcbiAgICAgICAgICAgICAgICB1bmlmb3JtLm5hbWUgPSBpbmZvLm5hbWUuc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmlmb3JtLm5hbWUgPSBpbmZvLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl91bmlmb3Jtc1t1bmlmb3JtLm5hbWVdID0gdW5pZm9ybTtcbiAgICAgICAgICAgIGlmICh1bmlmb3JtLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pZm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBSZWZlcmVuY2VFcnJvcignTm8gXCInICsgbmFtZSArICdcIiB1bmlmb3JtIGZvdW5kJyk7XG4gICAgfSxcbiAgICBnZXRBdHRyOiBmdW5jdGlvbiBnZXRBdHRyKG5hbWUpIHtcbiAgICAgICAgdmFyIGF0dHIgPSB0aGlzLl9hdHRyc1tuYW1lXTtcbiAgICAgICAgaWYgKGF0dHIpIHtcbiAgICAgICAgICAgIHJldHVybiBhdHRyO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICgtLXRoaXMuX2F0dHJJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICBhdHRyID0gdGhpcy5fZ2wuZ2V0QWN0aXZlQXR0cmliKHRoaXMuX3Byb2dyYW0sIHRoaXMuX2F0dHJJbmRleCk7XG4gICAgICAgICAgICBhdHRyLmxvY2F0aW9uID0gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5fcHJvZ3JhbSwgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLl9hdHRyc1tuYW1lXSA9IGF0dHI7XG4gICAgICAgICAgICBpZiAoYXR0ci5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgUmVmZXJlbmNlRXJyb3IoJ05vIFwiJyArIG5hbWUgKyAnXCIgYXR0cmlidXRlIGZvdW5kJyk7XG4gICAgfSxcbiAgICBjb25zdHJ1Y3RvcjogU2hhZGVyUHJvZ3JhbVxufTtcblNoYWRlclByb2dyYW0ucHJvdG90eXBlLnNldFVuaWZvcm0gPSBmdW5jdGlvbiBzZXRVbmlmb3JtKG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHVuaWZvcm0gPSB0aGlzLmdldFVuaWZvcm0obmFtZSk7XG4gICAgdmFyIF9nbCA9IHRoaXMuX2dsO1xuICAgIHN3aXRjaCAodW5pZm9ybS50eXBlKSB7XG4gICAgY2FzZSBfZ2wuQk9PTDpcbiAgICBjYXNlIF9nbC5JTlQ6XG4gICAgICAgIGlmICh1bmlmb3JtLnNpemUgPiAxKSB7XG4gICAgICAgICAgICBfZ2wudW5pZm9ybTFpdih1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZ2wudW5pZm9ybTFpKHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlIF9nbC5GTE9BVDpcbiAgICAgICAgaWYgKHVuaWZvcm0uc2l6ZSA+IDEpIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtMWZ2KHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtMWYodW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX01BVDI6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4MmZ2KHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX01BVDM6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4M2Z2KHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX01BVDQ6XG4gICAgICAgIF9nbC51bmlmb3JtTWF0cml4NGZ2KHVuaWZvcm0ubG9jYXRpb24sIGZhbHNlLCB2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgX2dsLkZMT0FUX1ZFQzI6XG4gICAgICAgIGlmICh1bmlmb3JtLnNpemUgPiAxKSB7XG4gICAgICAgICAgICBfZ2wudW5pZm9ybTJmdih1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZ2wudW5pZm9ybTJmKHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlWzBdLCB2YWx1ZVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfVkVDMzpcbiAgICAgICAgaWYgKHVuaWZvcm0uc2l6ZSA+IDEpIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtM2Z2KHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtM2YodW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbMF0sIHZhbHVlWzFdLCB2YWx1ZVsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBfZ2wuRkxPQVRfVkVDNDpcbiAgICAgICAgaWYgKHVuaWZvcm0uc2l6ZSA+IDEpIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtNGZ2KHVuaWZvcm0ubG9jYXRpb24sIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9nbC51bmlmb3JtNGYodW5pZm9ybS5sb2NhdGlvbiwgdmFsdWVbMF0sIHZhbHVlWzFdLCB2YWx1ZVsyXSwgdmFsdWVbM10pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVGhlIHVuaWZvcm0gdHlwZSBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbm1vZHVsZS5leHBvcnRzID0gU2hhZGVyUHJvZ3JhbTsiLCIndXNlIHN0cmljdCc7XG52YXIgTGlnaHRFbWl0dGVyID0gcmVxdWlyZSgnbGlnaHRfZW1pdHRlcicpO1xudmFyIHRpbWVzdGFtcCA9IHJlcXVpcmUoJ3BlYWtvL3RpbWVzdGFtcCcpO1xudmFyIHRpbWVyID0gcmVxdWlyZSgncGVha28vdGltZXInKTtcbmZ1bmN0aW9uIFRpY2tlcigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgTGlnaHRFbWl0dGVyLmNhbGwodGhpcyk7XG4gICAgdGhpcy5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xuICAgIHRoaXMubGFzdFJlcXVlc3RUaW1lID0gMDtcbiAgICB0aGlzLnNraXBwZWRUaW1lID0gMDtcbiAgICB0aGlzLnRvdGFsVGltZSA9IDA7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gc3RhcnQoX25vdykge1xuICAgICAgICB2YXIgZWxhcHNlZFRpbWU7XG4gICAgICAgIGlmICghc2VsZi5ydW5uaW5nKSB7XG4gICAgICAgICAgICBpZiAoIV9ub3cpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCA9IHRpbWVyLnJlcXVlc3Qoc3RhcnQpO1xuICAgICAgICAgICAgICAgIHNlbGYubGFzdFJlcXVlc3RUaW1lID0gdGltZXN0YW1wKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICghX25vdykge1xuICAgICAgICAgICAgX25vdyA9IHRpbWVzdGFtcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsYXBzZWRUaW1lID0gTWF0aC5taW4oMSwgKF9ub3cgLSBzZWxmLmxhc3RSZXF1ZXN0VGltZSkgKiAwLjAwMSk7XG4gICAgICAgIHNlbGYuc2tpcHBlZFRpbWUgKz0gZWxhcHNlZFRpbWU7XG4gICAgICAgIHNlbGYudG90YWxUaW1lICs9IGVsYXBzZWRUaW1lO1xuICAgICAgICB3aGlsZSAoc2VsZi5za2lwcGVkVGltZSA+PSBzZWxmLnN0ZXAgJiYgc2VsZi5ydW5uaW5nKSB7XG4gICAgICAgICAgICBzZWxmLnNraXBwZWRUaW1lIC09IHNlbGYuc3RlcDtcbiAgICAgICAgICAgIHNlbGYuZW1pdCgndXBkYXRlJywgc2VsZi5zdGVwLCBfbm93KTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmVtaXQoJ3JlbmRlcicsIGVsYXBzZWRUaW1lLCBfbm93KTtcbiAgICAgICAgc2VsZi5sYXN0UmVxdWVzdFRpbWUgPSBfbm93O1xuICAgICAgICBzZWxmLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCA9IHRpbWVyLnJlcXVlc3Qoc3RhcnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICAgIHRoaXMuZnBzKDYwKTtcbn1cblRpY2tlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExpZ2h0RW1pdHRlci5wcm90b3R5cGUpO1xuVGlja2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpY2tlcjtcblRpY2tlci5wcm90b3R5cGUuZnBzID0gZnVuY3Rpb24gZnBzKGZwcykge1xuICAgIHRoaXMuc3RlcCA9IDEgLyBmcHM7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVGlja2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMuc2tpcHBlZFRpbWUgPSAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblRpY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBUaWNrZXI7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIG1hdDMgPSByZXF1aXJlKCcuL21hdDMnKTtcbmZ1bmN0aW9uIFRyYW5zZm9ybSgpIHtcbiAgICB0aGlzLm1hdHJpeCA9IG1hdDMuaWRlbnRpdHkoKTtcbiAgICB0aGlzLl9pbmRleCA9IC0xO1xuICAgIHRoaXMuX3N0YWNrID0gW107XG59XG5UcmFuc2Zvcm0ucHJvdG90eXBlID0ge1xuICAgIHNhdmU6IGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgICAgIGlmICgrK3RoaXMuX2luZGV4IDwgdGhpcy5fc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICBtYXQzLmNvcHkodGhpcy5fc3RhY2tbdGhpcy5faW5kZXhdLCB0aGlzLm1hdHJpeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFjay5wdXNoKG1hdDMuY2xvbmUodGhpcy5tYXRyaXgpKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luZGV4ID49IDApIHtcbiAgICAgICAgICAgIG1hdDMuY29weSh0aGlzLm1hdHJpeCwgdGhpcy5fc3RhY2tbdGhpcy5faW5kZXgtLV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF0My5zZXRJZGVudGl0eSh0aGlzLm1hdHJpeCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KSB7XG4gICAgICAgIG1hdDMuc2V0VHJhbnNmb3JtKHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSk7XG4gICAgfSxcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uIHRyYW5zbGF0ZSh4LCB5KSB7XG4gICAgICAgIG1hdDMudHJhbnNsYXRlKHRoaXMubWF0cml4LCB4LCB5KTtcbiAgICB9LFxuICAgIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIG1hdDMucm90YXRlKHRoaXMubWF0cml4LCBhbmdsZSk7XG4gICAgfSxcbiAgICBzY2FsZTogZnVuY3Rpb24gc2NhbGUoeCwgeSkge1xuICAgICAgICBtYXQzLnNjYWxlKHRoaXMubWF0cml4LCB4LCB5KTtcbiAgICB9LFxuICAgIHRyYW5zZm9ybTogZnVuY3Rpb24gdHJhbnNmb3JtKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KSB7XG4gICAgICAgIG1hdDMudHJhbnNmb3JtKHRoaXMubWF0cml4LCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSk7XG4gICAgfSxcbiAgICBjb25zdHJ1Y3RvcjogVHJhbnNmb3JtXG59O1xubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHRUbyA9IHJlcXVpcmUoJ3BlYWtvL2RlZmF1bHQtdG8nKTtcbnZhciBWZWN0b3IyRCA9IHJlcXVpcmUoJy4uL21hdGgvVmVjdG9yMkQnKTtcbmZ1bmN0aW9uIENhbWVyYShyZW5kZXJlciwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHRoaXMueFNwZWVkID0gZGVmYXVsdFRvKG9wdGlvbnMueFNwZWVkLCAxKTtcbiAgICB0aGlzLnlTcGVlZCA9IGRlZmF1bHRUbyhvcHRpb25zLnlTcGVlZCwgMSk7XG4gICAgdGhpcy56b29tSW5TcGVlZCA9IGRlZmF1bHRUbyhvcHRpb25zLnpvb21JblNwZWVkLCAxKTtcbiAgICB0aGlzLnpvb21PdXRTcGVlZCA9IGRlZmF1bHRUbyhvcHRpb25zLnpvb21PdXRTcGVlZCwgMSk7XG4gICAgdGhpcy56b29tID0gZGVmYXVsdFRvKG9wdGlvbnMuem9vbSwgMSk7XG4gICAgdGhpcy5taW5ab29tID0gZGVmYXVsdFRvKG9wdGlvbnMubWluWm9vbSwgMSk7XG4gICAgdGhpcy5tYXhab29tID0gZGVmYXVsdFRvKG9wdGlvbnMubWF4Wm9vbSwgMSk7XG4gICAgdGhpcy5saW5lYXJab29tSW4gPSBkZWZhdWx0VG8ob3B0aW9ucy5saW5lYXJab29tSW4sIHRydWUpO1xuICAgIHRoaXMubGluZWFyWm9vbU91dCA9IGRlZmF1bHRUbyhvcHRpb25zLmxpbmVhclpvb21PdXQsIHRydWUpO1xuICAgIHRoaXMub2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5vZmZzZXQpIHtcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ID0gbmV3IFZlY3RvcjJEKHJlbmRlcmVyLncgKiAwLjUsIHJlbmRlcmVyLmggKiAwLjUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLm9mZnNldCkge1xuICAgICAgICB0aGlzLm9mZnNldCA9IG5ldyBWZWN0b3IyRCgpO1xuICAgIH1cbiAgICB0aGlzLnBvc2l0aW9uID0gW1xuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAwXG4gICAgXTtcbn1cbkNhbWVyYS5wcm90b3R5cGUgPSB7XG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICAgIHZhciBwb3MgPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICBpZiAocG9zWzBdICE9PSBwb3NbMl0pIHtcbiAgICAgICAgICAgIHBvc1swXSArPSAocG9zWzJdIC0gcG9zWzBdKSAqIHRoaXMueFNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwb3NbMV0gIT09IHBvc1szXSkge1xuICAgICAgICAgICAgcG9zWzFdICs9IChwb3NbM10gLSBwb3NbMV0pICogdGhpcy55U3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBsb29rQXQ6IGZ1bmN0aW9uIGxvb2tBdChhdCkge1xuICAgICAgICB2YXIgcG9zID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdmFyIG9mZiA9IHRoaXMub2Zmc2V0O1xuICAgICAgICBwb3NbMl0gPSBvZmYueCAvIHRoaXMuem9vbSAtIGF0Lng7XG4gICAgICAgIHBvc1szXSA9IG9mZi55IC8gdGhpcy56b29tIC0gYXQueTtcbiAgICAgICAgcG9zWzRdID0gYXQueDtcbiAgICAgICAgcG9zWzVdID0gYXQueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaG91bGRMb29rQXQ6IGZ1bmN0aW9uIHNob3VsZExvb2tBdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyRCh0aGlzLnBvc2l0aW9uWzRdLCB0aGlzLnBvc2l0aW9uWzVdKTtcbiAgICB9LFxuICAgIGxvb2tzQXQ6IGZ1bmN0aW9uIGxvb2tzQXQoKSB7XG4gICAgICAgIHZhciB4ID0gKHRoaXMub2Zmc2V0LnggLSB0aGlzLnBvc2l0aW9uWzBdICogdGhpcy56b29tKSAvIHRoaXMuem9vbTtcbiAgICAgICAgdmFyIHkgPSAodGhpcy5vZmZzZXQueSAtIHRoaXMucG9zaXRpb25bMV0gKiB0aGlzLnpvb20pIC8gdGhpcy56b29tO1xuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjJEKHgsIHkpO1xuICAgIH0sXG4gICAgc2VlczogZnVuY3Rpb24gc2Vlcyh4LCB5LCB3LCBoLCByZW5kZXJlcikge1xuICAgICAgICB2YXIgb2ZmID0gdGhpcy5vZmZzZXQ7XG4gICAgICAgIHZhciBhdCA9IHRoaXMubG9va3NBdCgpO1xuICAgICAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggKyB3ID4gYXQueCAtIG9mZi54IC8gdGhpcy56b29tICYmIHggPCBhdC54ICsgKHJlbmRlcmVyLncgLSBvZmYueCkgLyB0aGlzLnpvb20gJiYgeSArIGggPiBhdC55IC0gb2ZmLnkgLyB0aGlzLnpvb20gJiYgeSA8IGF0LnkgKyAocmVuZGVyZXIuaCAtIG9mZi55KSAvIHRoaXMuem9vbTtcbiAgICB9LFxuICAgIHpvb21JbjogZnVuY3Rpb24gem9vbUluKCkge1xuICAgICAgICB2YXIgc3BlZWQ7XG4gICAgICAgIGlmICh0aGlzLnpvb20gIT09IHRoaXMubWF4Wm9vbSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubGluZWFyWm9vbUluKSB7XG4gICAgICAgICAgICAgICAgc3BlZWQgPSB0aGlzLnpvb21JblNwZWVkICogdGhpcy56b29tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IHRoaXMuem9vbUluU3BlZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnpvb20gPSBNYXRoLm1pbih0aGlzLnpvb20gKyBzcGVlZCwgdGhpcy5tYXhab29tKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgem9vbU91dDogZnVuY3Rpb24gem9vbU91dCgpIHtcbiAgICAgICAgdmFyIHNwZWVkO1xuICAgICAgICBpZiAodGhpcy56b29tICE9PSB0aGlzLm1pblpvb20pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVhclpvb21PdXQpIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IHRoaXMuem9vbU91dFNwZWVkICogdGhpcy56b29tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IHRoaXMuem9vbU91dFNwZWVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy56b29tID0gTWF0aC5tYXgodGhpcy56b29tIC0gc3BlZWQsIHRoaXMubWluWm9vbSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbnN0cnVjdG9yOiBDYW1lcmFcbn07XG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IEhTTEE7XG52YXIgY2xhbXAgPSByZXF1aXJlKCdwZWFrby9jbGFtcCcpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9wYXJzZScpO1xudmFyIFJHQkEgPSByZXF1aXJlKCcuL1JHQkEnKTtcbmZ1bmN0aW9uIEhTTEEoaCwgcywgbCwgYSkge1xuICAgIHRoaXMuc2V0KGgsIHMsIGwsIGEpO1xufVxuSFNMQS5wcm90b3R5cGUgPSB7XG4gICAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmdiYSgpLnBlcmNlaXZlZEJyaWdodG5lc3MoKTtcbiAgICB9LFxuICAgIGx1bWluYW5jZTogZnVuY3Rpb24gbHVtaW5hbmNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZ2JhKCkubHVtaW5hbmNlKCk7XG4gICAgfSxcbiAgICBicmlnaHRuZXNzOiBmdW5jdGlvbiBicmlnaHRuZXNzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZ2JhKCkuYnJpZ2h0bmVzcygpO1xuICAgIH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gJ2hzbGEoJyArIHRoaXNbMF0gKyAnLCAnICsgdGhpc1sxXSArICclLCAnICsgdGhpc1syXSArICclLCAnICsgdGhpc1szXSArICcpJztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KGgsIHMsIGwsIGEpIHtcbiAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgIGNhc2UgdHlwZW9mIGggPT09ICdzdHJpbmcnOlxuICAgICAgICAgICAgaCA9IHBhcnNlKGgpO1xuICAgICAgICBjYXNlIHR5cGVvZiBoID09PSAnb2JqZWN0JyAmJiBoICE9IG51bGw6XG4gICAgICAgICAgICBpZiAoaC50eXBlICE9PSB0aGlzLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBoID0gaFt0aGlzLnR5cGVdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzWzBdID0gaFswXTtcbiAgICAgICAgICAgIHRoaXNbMV0gPSBoWzFdO1xuICAgICAgICAgICAgdGhpc1syXSA9IGhbMl07XG4gICAgICAgICAgICB0aGlzWzNdID0gaFszXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgc3dpdGNoICh2b2lkIDApIHtcbiAgICAgICAgICAgIGNhc2UgaDpcbiAgICAgICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgICAgICBsID0gcyA9IGggPSAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBzOlxuICAgICAgICAgICAgICAgIGEgPSAxO1xuICAgICAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKGgpO1xuICAgICAgICAgICAgICAgIHMgPSBoID0gMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgbDpcbiAgICAgICAgICAgICAgICBhID0gcztcbiAgICAgICAgICAgICAgICBsID0gTWF0aC5mbG9vcihoKTtcbiAgICAgICAgICAgICAgICBzID0gaCA9IDA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGE6XG4gICAgICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGggPSBNYXRoLmZsb29yKGgpO1xuICAgICAgICAgICAgICAgIHMgPSBNYXRoLmZsb29yKHMpO1xuICAgICAgICAgICAgICAgIGwgPSBNYXRoLmZsb29yKGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpc1swXSA9IGg7XG4gICAgICAgICAgICB0aGlzWzFdID0gcztcbiAgICAgICAgICAgIHRoaXNbMl0gPSBsO1xuICAgICAgICAgICAgdGhpc1szXSA9IGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZ2JhOiBmdW5jdGlvbiByZ2JhKCkge1xuICAgICAgICB2YXIgcmdiYSA9IG5ldyBSR0JBKCk7XG4gICAgICAgIHZhciBoID0gdGhpc1swXSAlIDM2MCAvIDM2MDtcbiAgICAgICAgdmFyIHMgPSB0aGlzWzFdICogMC4wMTtcbiAgICAgICAgdmFyIGwgPSB0aGlzWzJdICogMC4wMTtcbiAgICAgICAgdmFyIHRyID0gaCArIDEgLyAzO1xuICAgICAgICB2YXIgdGcgPSBoO1xuICAgICAgICB2YXIgdGIgPSBoIC0gMSAvIDM7XG4gICAgICAgIHZhciBxO1xuICAgICAgICBpZiAobCA8IDAuNSkge1xuICAgICAgICAgICAgcSA9IGwgKiAoMSArIHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcSA9IGwgKyBzIC0gbCAqIHM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHAgPSAyICogbCAtIHE7XG4gICAgICAgIGlmICh0ciA8IDApIHtcbiAgICAgICAgICAgICsrdHI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRnIDwgMCkge1xuICAgICAgICAgICAgKyt0ZztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGIgPCAwKSB7XG4gICAgICAgICAgICArK3RiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0ciA+IDEpIHtcbiAgICAgICAgICAgIC0tdHI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRnID4gMSkge1xuICAgICAgICAgICAgLS10ZztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGIgPiAxKSB7XG4gICAgICAgICAgICAtLXRiO1xuICAgICAgICB9XG4gICAgICAgIHJnYmFbMF0gPSBmb28odHIsIHAsIHEpO1xuICAgICAgICByZ2JhWzFdID0gZm9vKHRnLCBwLCBxKTtcbiAgICAgICAgcmdiYVsyXSA9IGZvbyh0YiwgcCwgcSk7XG4gICAgICAgIHJnYmFbM10gPSB0aGlzWzNdO1xuICAgICAgICByZXR1cm4gcmdiYTtcbiAgICB9LFxuICAgIGxlcnA6IGZ1bmN0aW9uIGxlcnAoaCwgcywgbCwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGNvbG9yID0gbmV3IEhTTEEoKTtcbiAgICAgICAgY29sb3JbMF0gPSBoO1xuICAgICAgICBjb2xvclsxXSA9IHM7XG4gICAgICAgIGNvbG9yWzJdID0gbDtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVycENvbG9yKGNvbG9yLCB2YWx1ZSk7XG4gICAgfSxcbiAgICBsZXJwQ29sb3I6IGZ1bmN0aW9uIGxlcnBDb2xvcihjb2xvciwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmdiYSgpLmxlcnBDb2xvcihjb2xvciwgdmFsdWUpLmhzbGEoKTtcbiAgICB9LFxuICAgIHNoYWRlOiBmdW5jdGlvbiBzaGFkZShwZXJjZW50YWdlKSB7XG4gICAgICAgIHZhciBoc2xhID0gbmV3IEhTTEEoKTtcbiAgICAgICAgaHNsYVswXSA9IHRoaXNbMF07XG4gICAgICAgIGhzbGFbMV0gPSB0aGlzWzFdO1xuICAgICAgICBoc2xhWzJdID0gY2xhbXAodGhpc1syXSArIHBlcmNlbnRhZ2UsIDAsIDEwMCk7XG4gICAgICAgIGhzbGFbM10gPSB0aGlzWzNdO1xuICAgICAgICByZXR1cm4gaHNsYTtcbiAgICB9LFxuICAgIGNvbnN0cnVjdG9yOiBIU0xBXG59O1xuSFNMQS5wcm90b3R5cGUudHlwZSA9ICdoc2xhJztcbmZ1bmN0aW9uIGZvbyh0LCBwLCBxKSB7XG4gICAgaWYgKHQgPCAxIC8gNikge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgocCArIChxIC0gcCkgKiA2ICogdCkgKiAyNTUpO1xuICAgIH1cbiAgICBpZiAodCA8IDAuNSkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChxICogMjU1KTtcbiAgICB9XG4gICAgaWYgKHQgPCAyIC8gMykge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgocCArIChxIC0gcCkgKiAoMiAvIDMgLSB0KSAqIDYpICogMjU1KTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgucm91bmQocCAqIDI1NSk7XG59IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBSR0JBO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9wYXJzZScpO1xudmFyIEhTTEEgPSByZXF1aXJlKCcuL0hTTEEnKTtcbmZ1bmN0aW9uIFJHQkEociwgZywgYiwgYSkge1xuICAgIHRoaXMuc2V0KHIsIGcsIGIsIGEpO1xufVxuUkdCQS5wcm90b3R5cGUgPSB7XG4gICAgcGVyY2VpdmVkQnJpZ2h0bmVzczogZnVuY3Rpb24gcGVyY2VpdmVkQnJpZ2h0bmVzcygpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzWzBdO1xuICAgICAgICB2YXIgZyA9IHRoaXNbMV07XG4gICAgICAgIHZhciBiID0gdGhpc1syXTtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgwLjI5OSAqIHIgKiByICsgMC41ODcgKiBnICogZyArIDAuMTE0ICogYiAqIGIpO1xuICAgIH0sXG4gICAgbHVtaW5hbmNlOiBmdW5jdGlvbiBsdW1pbmFuY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzWzBdICogMC4yMTI2ICsgdGhpc1sxXSAqIDAuNzE1MiArIHRoaXNbMl0gKiAwLjA3MjI7XG4gICAgfSxcbiAgICBicmlnaHRuZXNzOiBmdW5jdGlvbiBicmlnaHRuZXNzKCkge1xuICAgICAgICByZXR1cm4gMC4yOTkgKiB0aGlzWzBdICsgMC41ODcgKiB0aGlzWzFdICsgMC4xMTQgKiB0aGlzWzJdO1xuICAgIH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIHRoaXNbMF0gKyAnLCAnICsgdGhpc1sxXSArICcsICcgKyB0aGlzWzJdICsgJywgJyArIHRoaXNbM10gKyAnKSc7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldChyLCBnLCBiLCBhKSB7XG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICBjYXNlIHR5cGVvZiByID09PSAnc3RyaW5nJzpcbiAgICAgICAgICAgIHIgPSBwYXJzZShyKTtcbiAgICAgICAgY2FzZSB0eXBlb2YgciA9PT0gJ29iamVjdCcgJiYgciAhPSBudWxsOlxuICAgICAgICAgICAgaWYgKHIudHlwZSAhPT0gdGhpcy50eXBlKSB7XG4gICAgICAgICAgICAgICAgciA9IHJbdGhpcy50eXBlXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpc1swXSA9IHJbMF07XG4gICAgICAgICAgICB0aGlzWzFdID0gclsxXTtcbiAgICAgICAgICAgIHRoaXNbMl0gPSByWzJdO1xuICAgICAgICAgICAgdGhpc1szXSA9IHJbM107XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHN3aXRjaCAodm9pZCAwKSB7XG4gICAgICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICAgICAgYiA9IGcgPSByID0gMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgZzpcbiAgICAgICAgICAgICAgICBhID0gMTtcbiAgICAgICAgICAgICAgICBiID0gZyA9IHIgPSBNYXRoLmZsb29yKHIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBiOlxuICAgICAgICAgICAgICAgIGEgPSBnO1xuICAgICAgICAgICAgICAgIGIgPSBnID0gciA9IE1hdGguZmxvb3Iocik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGE6XG4gICAgICAgICAgICAgICAgYSA9IDE7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHIgPSBNYXRoLmZsb29yKHIpO1xuICAgICAgICAgICAgICAgIGcgPSBNYXRoLmZsb29yKGcpO1xuICAgICAgICAgICAgICAgIGIgPSBNYXRoLmZsb29yKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpc1swXSA9IHI7XG4gICAgICAgICAgICB0aGlzWzFdID0gZztcbiAgICAgICAgICAgIHRoaXNbMl0gPSBiO1xuICAgICAgICAgICAgdGhpc1szXSA9IGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBoc2xhOiBmdW5jdGlvbiBoc2xhKCkge1xuICAgICAgICB2YXIgaHNsYSA9IG5ldyBIU0xBKCk7XG4gICAgICAgIHZhciByID0gdGhpc1swXSAvIDI1NTtcbiAgICAgICAgdmFyIGcgPSB0aGlzWzFdIC8gMjU1O1xuICAgICAgICB2YXIgYiA9IHRoaXNbMl0gLyAyNTU7XG4gICAgICAgIHZhciBtYXggPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICAgICAgdmFyIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgICAgICB2YXIgbCA9IChtYXggKyBtaW4pICogNTA7XG4gICAgICAgIHZhciBoLCBzO1xuICAgICAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcbiAgICAgICAgaWYgKGRpZmYpIHtcbiAgICAgICAgICAgIGlmIChsID4gNTApIHtcbiAgICAgICAgICAgICAgICBzID0gZGlmZiAvICgyIC0gbWF4IC0gbWluKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcyA9IGRpZmYgLyAobWF4ICsgbWluKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAobWF4KSB7XG4gICAgICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgICAgICAgaWYgKGcgPCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoZyAtIGIpIC8gZGlmZiArIDYuMjgzMjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoID0gMS4wNDcyICogKGcgLSBiKSAvIGRpZmY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgICAgIGggPSAxLjA0NzIgKiAoYiAtIHIpIC8gZGlmZiArIDIuMDk0NDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaCA9IDEuMDQ3MiAqIChyIC0gZykgLyBkaWZmICsgNC4xODg4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaCA9IE1hdGgucm91bmQoaCAqIDM2MCAvIDYuMjgzMik7XG4gICAgICAgICAgICBzID0gTWF0aC5yb3VuZChzICogMTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGggPSBzID0gMDtcbiAgICAgICAgfVxuICAgICAgICBoc2xhWzBdID0gaDtcbiAgICAgICAgaHNsYVsxXSA9IHM7XG4gICAgICAgIGhzbGFbMl0gPSBNYXRoLnJvdW5kKGwpO1xuICAgICAgICBoc2xhWzNdID0gdGhpc1szXTtcbiAgICAgICAgcmV0dXJuIGhzbGE7XG4gICAgfSxcbiAgICByZ2JhOiBmdW5jdGlvbiByZ2JhKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGxlcnA6IGZ1bmN0aW9uIGxlcnAociwgZywgYiwgdmFsdWUpIHtcbiAgICAgICAgciA9IHRoaXNbMF0gKyAociAtIHRoaXNbMF0pICogdmFsdWU7XG4gICAgICAgIGcgPSB0aGlzWzBdICsgKGcgLSB0aGlzWzBdKSAqIHZhbHVlO1xuICAgICAgICBiID0gdGhpc1swXSArIChiIC0gdGhpc1swXSkgKiB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5ldyBSR0JBKHIsIGcsIGIsIHRoaXNbM10pO1xuICAgIH0sXG4gICAgbGVycENvbG9yOiBmdW5jdGlvbiBsZXJwQ29sb3IoY29sb3IsIHZhbHVlKSB7XG4gICAgICAgIHZhciByLCBnLCBiO1xuICAgICAgICBpZiAodHlwZW9mIGNvbG9yICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29sb3IgPSBwYXJzZShjb2xvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbG9yLnR5cGUgIT09ICdyZ2JhJykge1xuICAgICAgICAgICAgY29sb3IgPSBjb2xvci5yZ2JhKCk7XG4gICAgICAgIH1cbiAgICAgICAgciA9IGNvbG9yWzBdO1xuICAgICAgICBnID0gY29sb3JbMV07XG4gICAgICAgIGIgPSBjb2xvclsyXTtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVycChyLCBnLCBiLCB2YWx1ZSk7XG4gICAgfSxcbiAgICBzaGFkZTogZnVuY3Rpb24gc2hhZGUocGVyY2VudGFnZXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHNsYSgpLnNoYWRlKHBlcmNlbnRhZ2VzKS5yZ2JhKCk7XG4gICAgfSxcbiAgICBjb25zdHJ1Y3RvcjogUkdCQVxufTtcblJHQkEucHJvdG90eXBlLnR5cGUgPSAncmdiYSc7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNvbG9ycyA9IHtcbiAgICAgICAgYWxpY2VibHVlOiAnZjBmOGZmZmYnLFxuICAgICAgICBhbnRpcXVld2hpdGU6ICdmYWViZDdmZicsXG4gICAgICAgIGFxdWE6ICcwMGZmZmZmZicsXG4gICAgICAgIGFxdWFtYXJpbmU6ICc3ZmZmZDRmZicsXG4gICAgICAgIGF6dXJlOiAnZjBmZmZmZmYnLFxuICAgICAgICBiZWlnZTogJ2Y1ZjVkY2ZmJyxcbiAgICAgICAgYmlzcXVlOiAnZmZlNGM0ZmYnLFxuICAgICAgICBibGFjazogJzAwMDAwMGZmJyxcbiAgICAgICAgYmxhbmNoZWRhbG1vbmQ6ICdmZmViY2RmZicsXG4gICAgICAgIGJsdWU6ICcwMDAwZmZmZicsXG4gICAgICAgIGJsdWV2aW9sZXQ6ICc4YTJiZTJmZicsXG4gICAgICAgIGJyb3duOiAnYTUyYTJhZmYnLFxuICAgICAgICBidXJseXdvb2Q6ICdkZWI4ODdmZicsXG4gICAgICAgIGNhZGV0Ymx1ZTogJzVmOWVhMGZmJyxcbiAgICAgICAgY2hhcnRyZXVzZTogJzdmZmYwMGZmJyxcbiAgICAgICAgY2hvY29sYXRlOiAnZDI2OTFlZmYnLFxuICAgICAgICBjb3JhbDogJ2ZmN2Y1MGZmJyxcbiAgICAgICAgY29ybmZsb3dlcmJsdWU6ICc2NDk1ZWRmZicsXG4gICAgICAgIGNvcm5zaWxrOiAnZmZmOGRjZmYnLFxuICAgICAgICBjcmltc29uOiAnZGMxNDNjZmYnLFxuICAgICAgICBjeWFuOiAnMDBmZmZmZmYnLFxuICAgICAgICBkYXJrYmx1ZTogJzAwMDA4YmZmJyxcbiAgICAgICAgZGFya2N5YW46ICcwMDhiOGJmZicsXG4gICAgICAgIGRhcmtnb2xkZW5yb2Q6ICdiODg2MGJmZicsXG4gICAgICAgIGRhcmtncmF5OiAnYTlhOWE5ZmYnLFxuICAgICAgICBkYXJrZ3JlZW46ICcwMDY0MDBmZicsXG4gICAgICAgIGRhcmtraGFraTogJ2JkYjc2YmZmJyxcbiAgICAgICAgZGFya21hZ2VudGE6ICc4YjAwOGJmZicsXG4gICAgICAgIGRhcmtvbGl2ZWdyZWVuOiAnNTU2YjJmZmYnLFxuICAgICAgICBkYXJrb3JhbmdlOiAnZmY4YzAwZmYnLFxuICAgICAgICBkYXJrb3JjaGlkOiAnOTkzMmNjZmYnLFxuICAgICAgICBkYXJrcmVkOiAnOGIwMDAwZmYnLFxuICAgICAgICBkYXJrc2FsbW9uOiAnZTk5NjdhZmYnLFxuICAgICAgICBkYXJrc2VhZ3JlZW46ICc4ZmJjOGZmZicsXG4gICAgICAgIGRhcmtzbGF0ZWJsdWU6ICc0ODNkOGJmZicsXG4gICAgICAgIGRhcmtzbGF0ZWdyYXk6ICcyZjRmNGZmZicsXG4gICAgICAgIGRhcmt0dXJxdW9pc2U6ICcwMGNlZDFmZicsXG4gICAgICAgIGRhcmt2aW9sZXQ6ICc5NDAwZDNmZicsXG4gICAgICAgIGRlZXBwaW5rOiAnZmYxNDkzZmYnLFxuICAgICAgICBkZWVwc2t5Ymx1ZTogJzAwYmZmZmZmJyxcbiAgICAgICAgZGltZ3JheTogJzY5Njk2OWZmJyxcbiAgICAgICAgZG9kZ2VyYmx1ZTogJzFlOTBmZmZmJyxcbiAgICAgICAgZmVsZHNwYXI6ICdkMTkyNzVmZicsXG4gICAgICAgIGZpcmVicmljazogJ2IyMjIyMmZmJyxcbiAgICAgICAgZmxvcmFsd2hpdGU6ICdmZmZhZjBmZicsXG4gICAgICAgIGZvcmVzdGdyZWVuOiAnMjI4YjIyZmYnLFxuICAgICAgICBmdWNoc2lhOiAnZmYwMGZmZmYnLFxuICAgICAgICBnYWluc2Jvcm86ICdkY2RjZGNmZicsXG4gICAgICAgIGdob3N0d2hpdGU6ICdmOGY4ZmZmZicsXG4gICAgICAgIGdvbGQ6ICdmZmQ3MDBmZicsXG4gICAgICAgIGdvbGRlbnJvZDogJ2RhYTUyMGZmJyxcbiAgICAgICAgZ3JheTogJzgwODA4MGZmJyxcbiAgICAgICAgZ3JlZW46ICcwMDgwMDBmZicsXG4gICAgICAgIGdyZWVueWVsbG93OiAnYWRmZjJmZmYnLFxuICAgICAgICBob25leWRldzogJ2YwZmZmMGZmJyxcbiAgICAgICAgaG90cGluazogJ2ZmNjliNGZmJyxcbiAgICAgICAgaW5kaWFucmVkOiAnY2Q1YzVjZmYnLFxuICAgICAgICBpbmRpZ286ICc0YjAwODJmZicsXG4gICAgICAgIGl2b3J5OiAnZmZmZmYwZmYnLFxuICAgICAgICBraGFraTogJ2YwZTY4Y2ZmJyxcbiAgICAgICAgbGF2ZW5kZXI6ICdlNmU2ZmFmZicsXG4gICAgICAgIGxhdmVuZGVyYmx1c2g6ICdmZmYwZjVmZicsXG4gICAgICAgIGxhd25ncmVlbjogJzdjZmMwMGZmJyxcbiAgICAgICAgbGVtb25jaGlmZm9uOiAnZmZmYWNkZmYnLFxuICAgICAgICBsaWdodGJsdWU6ICdhZGQ4ZTZmZicsXG4gICAgICAgIGxpZ2h0Y29yYWw6ICdmMDgwODBmZicsXG4gICAgICAgIGxpZ2h0Y3lhbjogJ2UwZmZmZmZmJyxcbiAgICAgICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6ICdmYWZhZDJmZicsXG4gICAgICAgIGxpZ2h0Z3JleTogJ2QzZDNkM2ZmJyxcbiAgICAgICAgbGlnaHRncmVlbjogJzkwZWU5MGZmJyxcbiAgICAgICAgbGlnaHRwaW5rOiAnZmZiNmMxZmYnLFxuICAgICAgICBsaWdodHNhbG1vbjogJ2ZmYTA3YWZmJyxcbiAgICAgICAgbGlnaHRzZWFncmVlbjogJzIwYjJhYWZmJyxcbiAgICAgICAgbGlnaHRza3libHVlOiAnODdjZWZhZmYnLFxuICAgICAgICBsaWdodHNsYXRlYmx1ZTogJzg0NzBmZmZmJyxcbiAgICAgICAgbGlnaHRzbGF0ZWdyYXk6ICc3Nzg4OTlmZicsXG4gICAgICAgIGxpZ2h0c3RlZWxibHVlOiAnYjBjNGRlZmYnLFxuICAgICAgICBsaWdodHllbGxvdzogJ2ZmZmZlMGZmJyxcbiAgICAgICAgbGltZTogJzAwZmYwMGZmJyxcbiAgICAgICAgbGltZWdyZWVuOiAnMzJjZDMyZmYnLFxuICAgICAgICBsaW5lbjogJ2ZhZjBlNmZmJyxcbiAgICAgICAgbWFnZW50YTogJ2ZmMDBmZmZmJyxcbiAgICAgICAgbWFyb29uOiAnODAwMDAwZmYnLFxuICAgICAgICBtZWRpdW1hcXVhbWFyaW5lOiAnNjZjZGFhZmYnLFxuICAgICAgICBtZWRpdW1ibHVlOiAnMDAwMGNkZmYnLFxuICAgICAgICBtZWRpdW1vcmNoaWQ6ICdiYTU1ZDNmZicsXG4gICAgICAgIG1lZGl1bXB1cnBsZTogJzkzNzBkOGZmJyxcbiAgICAgICAgbWVkaXVtc2VhZ3JlZW46ICczY2IzNzFmZicsXG4gICAgICAgIG1lZGl1bXNsYXRlYmx1ZTogJzdiNjhlZWZmJyxcbiAgICAgICAgbWVkaXVtc3ByaW5nZ3JlZW46ICcwMGZhOWFmZicsXG4gICAgICAgIG1lZGl1bXR1cnF1b2lzZTogJzQ4ZDFjY2ZmJyxcbiAgICAgICAgbWVkaXVtdmlvbGV0cmVkOiAnYzcxNTg1ZmYnLFxuICAgICAgICBtaWRuaWdodGJsdWU6ICcxOTE5NzBmZicsXG4gICAgICAgIG1pbnRjcmVhbTogJ2Y1ZmZmYWZmJyxcbiAgICAgICAgbWlzdHlyb3NlOiAnZmZlNGUxZmYnLFxuICAgICAgICBtb2NjYXNpbjogJ2ZmZTRiNWZmJyxcbiAgICAgICAgbmF2YWpvd2hpdGU6ICdmZmRlYWRmZicsXG4gICAgICAgIG5hdnk6ICcwMDAwODBmZicsXG4gICAgICAgIG9sZGxhY2U6ICdmZGY1ZTZmZicsXG4gICAgICAgIG9saXZlOiAnODA4MDAwZmYnLFxuICAgICAgICBvbGl2ZWRyYWI6ICc2YjhlMjNmZicsXG4gICAgICAgIG9yYW5nZTogJ2ZmYTUwMGZmJyxcbiAgICAgICAgb3JhbmdlcmVkOiAnZmY0NTAwZmYnLFxuICAgICAgICBvcmNoaWQ6ICdkYTcwZDZmZicsXG4gICAgICAgIHBhbGVnb2xkZW5yb2Q6ICdlZWU4YWFmZicsXG4gICAgICAgIHBhbGVncmVlbjogJzk4ZmI5OGZmJyxcbiAgICAgICAgcGFsZXR1cnF1b2lzZTogJ2FmZWVlZWZmJyxcbiAgICAgICAgcGFsZXZpb2xldHJlZDogJ2Q4NzA5M2ZmJyxcbiAgICAgICAgcGFwYXlhd2hpcDogJ2ZmZWZkNWZmJyxcbiAgICAgICAgcGVhY2hwdWZmOiAnZmZkYWI5ZmYnLFxuICAgICAgICBwZXJ1OiAnY2Q4NTNmZmYnLFxuICAgICAgICBwaW5rOiAnZmZjMGNiZmYnLFxuICAgICAgICBwbHVtOiAnZGRhMGRkZmYnLFxuICAgICAgICBwb3dkZXJibHVlOiAnYjBlMGU2ZmYnLFxuICAgICAgICBwdXJwbGU6ICc4MDAwODBmZicsXG4gICAgICAgIHJlZDogJ2ZmMDAwMGZmJyxcbiAgICAgICAgcm9zeWJyb3duOiAnYmM4ZjhmZmYnLFxuICAgICAgICByb3lhbGJsdWU6ICc0MTY5ZTFmZicsXG4gICAgICAgIHNhZGRsZWJyb3duOiAnOGI0NTEzZmYnLFxuICAgICAgICBzYWxtb246ICdmYTgwNzJmZicsXG4gICAgICAgIHNhbmR5YnJvd246ICdmNGE0NjBmZicsXG4gICAgICAgIHNlYWdyZWVuOiAnMmU4YjU3ZmYnLFxuICAgICAgICBzZWFzaGVsbDogJ2ZmZjVlZWZmJyxcbiAgICAgICAgc2llbm5hOiAnYTA1MjJkZmYnLFxuICAgICAgICBzaWx2ZXI6ICdjMGMwYzBmZicsXG4gICAgICAgIHNreWJsdWU6ICc4N2NlZWJmZicsXG4gICAgICAgIHNsYXRlYmx1ZTogJzZhNWFjZGZmJyxcbiAgICAgICAgc2xhdGVncmF5OiAnNzA4MDkwZmYnLFxuICAgICAgICBzbm93OiAnZmZmYWZhZmYnLFxuICAgICAgICBzcHJpbmdncmVlbjogJzAwZmY3ZmZmJyxcbiAgICAgICAgc3RlZWxibHVlOiAnNDY4MmI0ZmYnLFxuICAgICAgICB0YW46ICdkMmI0OGNmZicsXG4gICAgICAgIHRlYWw6ICcwMDgwODBmZicsXG4gICAgICAgIHRoaXN0bGU6ICdkOGJmZDhmZicsXG4gICAgICAgIHRvbWF0bzogJ2ZmNjM0N2ZmJyxcbiAgICAgICAgdHVycXVvaXNlOiAnNDBlMGQwZmYnLFxuICAgICAgICB2aW9sZXQ6ICdlZTgyZWVmZicsXG4gICAgICAgIHZpb2xldHJlZDogJ2QwMjA5MGZmJyxcbiAgICAgICAgd2hlYXQ6ICdmNWRlYjNmZicsXG4gICAgICAgIHdoaXRlOiAnZmZmZmZmZmYnLFxuICAgICAgICB3aGl0ZXNtb2tlOiAnZjVmNWY1ZmYnLFxuICAgICAgICB5ZWxsb3c6ICdmZmZmMDBmZicsXG4gICAgICAgIHllbGxvd2dyZWVuOiAnOWFjZDMyZmYnLFxuICAgICAgICB0cmFuc3BhcmVudDogJzAwMDAwMDAwJ1xuICAgIH07XG5tb2R1bGUuZXhwb3J0cyA9IGNvbG9yczsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xudmFyIFJHQkEgPSByZXF1aXJlKCcuLi9SR0JBJyk7XG52YXIgSFNMQSA9IHJlcXVpcmUoJy4uL0hTTEEnKTtcbnZhciBjb2xvcnMgPSByZXF1aXJlKCcuL2NvbG9ycycpO1xudmFyIHBhcnNlZCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG52YXIgVFJBTlNQQVJFTlQgPSBbXG4gICAgICAgIDAsXG4gICAgICAgIDAsXG4gICAgICAgIDAsXG4gICAgICAgIDBcbiAgICBdO1xudmFyIHJlZ2V4cHMgPSB7XG4gICAgICAgIGhleDM6IC9eIyhbMC05YS1mXSkoWzAtOWEtZl0pKFswLTlhLWZdKShbMC05YS1mXSk/JC8sXG4gICAgICAgIGhleDogL14jKFswLTlhLWZdezZ9KShbMC05YS1mXXsyfSk/JC8sXG4gICAgICAgIHJnYjogL15yZ2JcXHMqXFwoXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxccypcXCkkfF5cXHMqcmdiYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKlxcKSQvLFxuICAgICAgICBoc2w6IC9eaHNsXFxzKlxcKFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHUwMDI1XFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccypcXCkkfF5cXHMqaHNsYVxccypcXChcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFxzKixcXHMqKFxcZCt8XFxkKlxcLlxcZCspXFx1MDAyNVxccyosXFxzKihcXGQrfFxcZCpcXC5cXGQrKVxcdTAwMjVcXHMqLFxccyooXFxkK3xcXGQqXFwuXFxkKylcXHMqXFwpJC9cbiAgICB9O1xuZnVuY3Rpb24gcGFyc2Uoc3RyaW5nKSB7XG4gICAgdmFyIGNhY2hlID0gcGFyc2VkW3N0cmluZ10gfHwgcGFyc2VkW3N0cmluZyA9IHN0cmluZy50cmltKCkudG9Mb3dlckNhc2UoKV07XG4gICAgaWYgKCFjYWNoZSkge1xuICAgICAgICBpZiAoY2FjaGUgPSBjb2xvcnNbc3RyaW5nXSkge1xuICAgICAgICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKHBhcnNlSGV4KGNhY2hlKSwgUkdCQSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGNhY2hlID0gcmVnZXhwcy5oZXguZXhlYyhzdHJpbmcpKSB8fCAoY2FjaGUgPSByZWdleHBzLmhleDMuZXhlYyhzdHJpbmcpKSkge1xuICAgICAgICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKHBhcnNlSGV4KGZvcm1hdEhleChjYWNoZSkpLCBSR0JBKTtcbiAgICAgICAgfSBlbHNlIGlmIChjYWNoZSA9IHJlZ2V4cHMucmdiLmV4ZWMoc3RyaW5nKSkge1xuICAgICAgICAgICAgY2FjaGUgPSBuZXcgQ29sb3JEYXRhKGNvbXBhY3RNYXRjaChjYWNoZSksIFJHQkEpO1xuICAgICAgICB9IGVsc2UgaWYgKGNhY2hlID0gcmVnZXhwcy5oc2wuZXhlYyhzdHJpbmcpKSB7XG4gICAgICAgICAgICBjYWNoZSA9IG5ldyBDb2xvckRhdGEoY29tcGFjdE1hdGNoKGNhY2hlKSwgSFNMQSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBTeW50YXhFcnJvcihzdHJpbmcgKyAnIGlzIG5vdCBhIHZhbGlkIHN5bnRheCcpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlZFtzdHJpbmddID0gY2FjaGU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgY2FjaGUuY29sb3IoY2FjaGVbMF0sIGNhY2hlWzFdLCBjYWNoZVsyXSwgY2FjaGVbM10pO1xufVxuZnVuY3Rpb24gZm9ybWF0SGV4KG1hdGNoKSB7XG4gICAgdmFyIHIsIGcsIGIsIGE7XG4gICAgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMykge1xuICAgICAgICByZXR1cm4gbWF0Y2hbMV0gKyAobWF0Y2hbMl0gfHwgJ2ZmJyk7XG4gICAgfVxuICAgIHIgPSBtYXRjaFsxXTtcbiAgICBnID0gbWF0Y2hbMl07XG4gICAgYiA9IG1hdGNoWzNdO1xuICAgIGEgPSBtYXRjaFs0XSB8fCAnZic7XG4gICAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYiArIGEgKyBhO1xufVxuZnVuY3Rpb24gcGFyc2VIZXgoaGV4KSB7XG4gICAgaWYgKGhleCA9PSAwKSB7XG4gICAgICAgIHJldHVybiBUUkFOU1BBUkVOVDtcbiAgICB9XG4gICAgaGV4ID0gcGFyc2VJbnQoaGV4LCAxNik7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgaGV4ID4+IDI0ICYgMjU1LFxuICAgICAgICBoZXggPj4gMTYgJiAyNTUsXG4gICAgICAgIGhleCA+PiA4ICYgMjU1LFxuICAgICAgICAoaGV4ICYgMjU1KSAvIDI1NVxuICAgIF07XG59XG5mdW5jdGlvbiBjb21wYWN0TWF0Y2gobWF0Y2gpIHtcbiAgICBpZiAobWF0Y2hbN10pIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIE51bWJlcihtYXRjaFs0XSksXG4gICAgICAgICAgICBOdW1iZXIobWF0Y2hbNV0pLFxuICAgICAgICAgICAgTnVtYmVyKG1hdGNoWzZdKSxcbiAgICAgICAgICAgIE51bWJlcihtYXRjaFs3XSlcbiAgICAgICAgXTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAgTnVtYmVyKG1hdGNoWzFdKSxcbiAgICAgICAgTnVtYmVyKG1hdGNoWzJdKSxcbiAgICAgICAgTnVtYmVyKG1hdGNoWzNdKVxuICAgIF07XG59XG5mdW5jdGlvbiBDb2xvckRhdGEobWF0Y2gsIGNvbG9yKSB7XG4gICAgdGhpc1swXSA9IG1hdGNoWzBdO1xuICAgIHRoaXNbMV0gPSBtYXRjaFsxXTtcbiAgICB0aGlzWzJdID0gbWF0Y2hbMl07XG4gICAgdGhpc1szXSA9IG1hdGNoWzNdO1xuICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbn0iLCIndXNlIHN0cmljdCc7XG52YXIgX2NvbnN0YW50cyA9IHt9O1xudmFyIF9jb3VudGVyID0gMDtcbmZ1bmN0aW9uIGFkZChrZXkpIHtcbiAgICBpZiAodHlwZW9mIF9jb25zdGFudHNba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCByZS1zZXQgKGFkZCkgZXhpc3RpbmcgY29uc3RhbnQ6ICcgKyBrZXkpO1xuICAgIH1cbiAgICBfY29uc3RhbnRzW2tleV0gPSArK19jb3VudGVyO1xufVxuZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIGlmICh0eXBlb2YgX2NvbnN0YW50c1trZXldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aHJvdyBSZWZlcmVuY2VFcnJvcignQ2Fubm90IGdldCB1bmtub3duIGNvbnN0YW50OiAnICsga2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIF9jb25zdGFudHNba2V5XTtcbn1cbltcbiAgICAnQVVUTycsXG4gICAgJ0dMJyxcbiAgICAnMkQnLFxuICAgICdMRUZUJyxcbiAgICAnVE9QJyxcbiAgICAnQ0VOVEVSJyxcbiAgICAnTUlERExFJyxcbiAgICAnUklHSFQnLFxuICAgICdCT1RUT00nLFxuICAgICdQRVJDRU5UJ1xuXS5mb3JFYWNoKGFkZCk7XG5leHBvcnRzLmFkZCA9IGFkZDtcbmV4cG9ydHMuZ2V0ID0gZ2V0OyIsIid1c2Ugc3RyaWN0JztcbnZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCdsaWdodF9lbWl0dGVyJyk7XG5mdW5jdGlvbiBBYnN0cmFjdEltYWdlKCkge1xuICAgIHRocm93IEVycm9yKCdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0SW1hZ2UpJyk7XG59XG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGlnaHRFbWl0dGVyLnByb3RvdHlwZSk7XG5BYnN0cmFjdEltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFic3RyYWN0SW1hZ2U7XG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0SW1hZ2U7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIEFic3RyYWN0SW1hZ2UgPSByZXF1aXJlKCcuL0Fic3RyYWN0SW1hZ2UnKTtcbmZ1bmN0aW9uIENvbXBvdW5kZWRJbWFnZShpbWFnZSwgc3gsIHN5LCBzdywgc2gsIGR3LCBkaCkge1xuICAgIHRoaXMuaW1hZ2UgPSBpbWFnZTtcbiAgICB0aGlzLnN4ID0gc3g7XG4gICAgdGhpcy5zeSA9IHN5O1xuICAgIHRoaXMuc3cgPSBzdztcbiAgICB0aGlzLnNoID0gc2g7XG4gICAgdGhpcy5kdyA9IGR3O1xuICAgIHRoaXMuZGggPSBkaDtcbn1cbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFic3RyYWN0SW1hZ2UucHJvdG90eXBlKTtcbkNvbXBvdW5kZWRJbWFnZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb21wb3VuZGVkSW1hZ2U7XG5Db21wb3VuZGVkSW1hZ2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbWFnZS5nZXQoKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvdW5kZWRJbWFnZTsiLCIndXNlIHN0cmljdCc7XG52YXIgQ29tcG91bmRlZEltYWdlID0gcmVxdWlyZSgnLi9Db21wb3VuZGVkSW1hZ2UnKTtcbnZhciBBYnN0cmFjdEltYWdlID0gcmVxdWlyZSgnLi9BYnN0cmFjdEltYWdlJyk7XG5mdW5jdGlvbiBJbWFnZShpbWFnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIWltYWdlLnNyYykge1xuICAgICAgICB0aHJvdyBFcnJvcignQ2Fubm90IGNyZWF0ZSB2Ni5JbWFnZSBmcm9tIEhUTUxJbWFnZUVsZW1lbnQgd2l0aCBubyBcInNyY1wiIGF0dHJpYnV0ZSAobmV3IHY2LkltYWdlKScpO1xuICAgIH1cbiAgICB0aGlzLmltYWdlID0gaW1hZ2U7XG4gICAgaWYgKHRoaXMuaW1hZ2UuY29tcGxldGUpIHtcbiAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIG9ubG9hZCgpIHtcbiAgICAgICAgICAgIHNlbGYuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9ubG9hZCk7XG4gICAgICAgICAgICBzZWxmLl9pbml0KCk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG59XG5JbWFnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFic3RyYWN0SW1hZ2UucHJvdG90eXBlKTtcbkltYWdlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEltYWdlO1xuSW1hZ2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gX2luaXQoKSB7XG4gICAgdGhpcy5zeCA9IDA7XG4gICAgdGhpcy5zeSA9IDA7XG4gICAgdGhpcy5zdyA9IHRoaXMuZHcgPSB0aGlzLmltYWdlLndpZHRoO1xuICAgIHRoaXMuc2ggPSB0aGlzLmRoID0gdGhpcy5pbWFnZS5oZWlnaHQ7XG4gICAgdGhpcy5lbWl0KCdjb21wbGV0ZScpO1xufTtcbkltYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuSW1hZ2UucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5pbWFnZS5zcmMpICYmIHRoaXMuaW1hZ2UuY29tcGxldGU7XG59O1xuSW1hZ2UucHJvdG90eXBlLnNyYyA9IGZ1bmN0aW9uIHNyYygpIHtcbiAgICByZXR1cm4gdGhpcy5pbWFnZS5zcmM7XG59O1xuSW1hZ2UuZnJvbVVSTCA9IGZ1bmN0aW9uIGZyb21VUkwoc3JjKSB7XG4gICAgdmFyIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgaW1hZ2Uuc3JjID0gc3JjO1xuICAgIHJldHVybiBuZXcgSW1hZ2UoaW1hZ2UpO1xufTtcbkltYWdlLnN0cmV0Y2ggPSBmdW5jdGlvbiBzdHJldGNoKGltYWdlLCBkdywgZGgpIHtcbiAgICB2YXIgdmFsdWUgPSBkaCAvIGltYWdlLmRoICogaW1hZ2UuZHc7XG4gICAgaWYgKHZhbHVlIDwgZHcpIHtcbiAgICAgICAgZGggPSBkdyAvIGltYWdlLmR3ICogaW1hZ2UuZGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZHcgPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb21wb3VuZGVkSW1hZ2UoaW1hZ2UuZ2V0KCksIGltYWdlLnN4LCBpbWFnZS5zeSwgaW1hZ2Uuc3csIGltYWdlLnNoLCBkdywgZGgpO1xufTtcbkltYWdlLmN1dCA9IGZ1bmN0aW9uIGN1dChpbWFnZSwgc3gsIHN5LCBkdywgZGgpIHtcbiAgICB2YXIgc3cgPSBpbWFnZS5zdyAvIGltYWdlLmR3ICogZHc7XG4gICAgdmFyIHNoID0gaW1hZ2Uuc2ggLyBpbWFnZS5kaCAqIGRoO1xuICAgIHN4ICs9IGltYWdlLnN4O1xuICAgIGlmIChzeCArIHN3ID4gaW1hZ2Uuc3ggKyBpbWFnZS5zdykge1xuICAgICAgICB0aHJvdyBFcnJvcignQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFggb3IgVyBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyk7XG4gICAgfVxuICAgIHN5ICs9IGltYWdlLnN5O1xuICAgIGlmIChzeSArIHNoID4gaW1hZ2Uuc3kgKyBpbWFnZS5zaCkge1xuICAgICAgICB0aHJvdyBFcnJvcignQ2Fubm90IGN1dCB0aGUgaW1hZ2UgYmVjYXVzZSB0aGUgbmV3IGltYWdlIFkgb3IgSCBpcyBvdXQgb2YgYm91bmRzICh2Ni5JbWFnZS5jdXQpJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29tcG91bmRlZEltYWdlKGltYWdlLmdldCgpLCBzeCwgc3ksIHN3LCBzaCwgZHcsIGRoKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlOyIsIid1c2Ugc3RyaWN0JztcbnZhciBfRmxvYXQzMkFycmF5O1xuaWYgKHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICBfRmxvYXQzMkFycmF5ID0gRmxvYXQzMkFycmF5O1xufSBlbHNlIHtcbiAgICBfRmxvYXQzMkFycmF5ID0gQXJyYXk7XG59XG5mdW5jdGlvbiBjcmVhdGVQb2x5Z29uKHNpZGVzKSB7XG4gICAgdmFyIGkgPSBNYXRoLmZsb29yKHNpZGVzKTtcbiAgICB2YXIgc3RlcCA9IE1hdGguUEkgKiAyIC8gc2lkZXM7XG4gICAgdmFyIHZlcnRpY2VzID0gbmV3IF9GbG9hdDMyQXJyYXkoaSAqIDIgKyAyKTtcbiAgICBmb3IgKDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmVydGljZXNbaSAqIDJdID0gTWF0aC5jb3Moc3RlcCAqIGkpO1xuICAgICAgICB2ZXJ0aWNlc1sxICsgaSAqIDJdID0gTWF0aC5zaW4oc3RlcCAqIGkpO1xuICAgIH1cbiAgICByZXR1cm4gdmVydGljZXM7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBvbHlnb247IiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbSh2ZXJ0LCBmcmFnLCBnbCkge1xuICAgIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0KTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZyk7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignVW5hYmxlIHRvIGluaXRpYWxpemUgdGhlIHNoYWRlciBwcm9ncmFtOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xuICAgIH1cbiAgICBnbC52YWxpZGF0ZVByb2dyYW0ocHJvZ3JhbSk7XG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLlZBTElEQVRFX1NUQVRVUykpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ1VuYWJsZSB0byB2YWxpZGF0ZSB0aGUgc2hhZGVyIHByb2dyYW06ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtO1xufVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQcm9ncmFtOyIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGNyZWF0ZVNoYWRlcihzb3VyY2UsIHR5cGUsIGdsKSB7XG4gICAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKTtcbiAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICB0aHJvdyBTeW50YXhFcnJvcignQW4gZXJyb3Igb2NjdXJyZWQgY29tcGlsaW5nIHRoZSBzaGFkZXJzOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNoYWRlcjtcbn1cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2hhZGVyOyIsIid1c2Ugc3RyaWN0JzsiLCIndXNlIHN0cmljdCc7XG52YXIgbm9vcCA9IHJlcXVpcmUoJ3BlYWtvL25vb3AnKTtcbnZhciByZXBvcnQsIHJlcG9ydGVkO1xuaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICByZXBvcnRlZCA9IHt9O1xuICAgIHJlcG9ydCA9IGZ1bmN0aW9uIHJlcG9ydChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChyZXBvcnRlZFttZXNzYWdlXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgcmVwb3J0ZWRbbWVzc2FnZV0gPSB0cnVlO1xuICAgIH07XG59IGVsc2Uge1xuICAgIHJlcG9ydCA9IG5vb3A7XG59XG5tb2R1bGUuZXhwb3J0cyA9IHJlcG9ydDsiLCIndXNlIHN0cmljdCc7XG5leHBvcnRzLmlkZW50aXR5ID0gZnVuY3Rpb24gaWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgMSxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMSxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMCxcbiAgICAgICAgMVxuICAgIF07XG59O1xuZXhwb3J0cy5zZXRJZGVudGl0eSA9IGZ1bmN0aW9uIHNldElkZW50aXR5KG0xKSB7XG4gICAgbTFbMF0gPSAxO1xuICAgIG0xWzFdID0gMDtcbiAgICBtMVsyXSA9IDA7XG4gICAgbTFbM10gPSAwO1xuICAgIG0xWzRdID0gMTtcbiAgICBtMVs1XSA9IDA7XG4gICAgbTFbNl0gPSAwO1xuICAgIG0xWzddID0gMDtcbiAgICBtMVs4XSA9IDE7XG59O1xuZXhwb3J0cy5jb3B5ID0gZnVuY3Rpb24gY29weShtMSwgbTIpIHtcbiAgICBtMVswXSA9IG0yWzBdO1xuICAgIG0xWzFdID0gbTJbMV07XG4gICAgbTFbMl0gPSBtMlsyXTtcbiAgICBtMVszXSA9IG0yWzNdO1xuICAgIG0xWzRdID0gbTJbNF07XG4gICAgbTFbNV0gPSBtMls1XTtcbiAgICBtMVs2XSA9IG0yWzZdO1xuICAgIG0xWzddID0gbTJbN107XG4gICAgbTFbOF0gPSBtMls4XTtcbn07XG5leHBvcnRzLmNsb25lID0gZnVuY3Rpb24gY2xvbmUobTEpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICBtMVswXSxcbiAgICAgICAgbTFbMV0sXG4gICAgICAgIG0xWzJdLFxuICAgICAgICBtMVszXSxcbiAgICAgICAgbTFbNF0sXG4gICAgICAgIG0xWzVdLFxuICAgICAgICBtMVs2XSxcbiAgICAgICAgbTFbN10sXG4gICAgICAgIG0xWzhdXG4gICAgXTtcbn07XG5leHBvcnRzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIHRyYW5zbGF0ZShtMSwgeCwgeSkge1xuICAgIG0xWzZdID0geCAqIG0xWzBdICsgeSAqIG0xWzNdICsgbTFbNl07XG4gICAgbTFbN10gPSB4ICogbTFbMV0gKyB5ICogbTFbNF0gKyBtMVs3XTtcbiAgICBtMVs4XSA9IHggKiBtMVsyXSArIHkgKiBtMVs1XSArIG0xWzhdO1xufTtcbmV4cG9ydHMucm90YXRlID0gZnVuY3Rpb24gcm90YXRlKG0xLCBhbmdsZSkge1xuICAgIHZhciBtMTAgPSBtMVswXTtcbiAgICB2YXIgbTExID0gbTFbMV07XG4gICAgdmFyIG0xMiA9IG0xWzJdO1xuICAgIHZhciBtMTMgPSBtMVszXTtcbiAgICB2YXIgbTE0ID0gbTFbNF07XG4gICAgdmFyIG0xNSA9IG0xWzVdO1xuICAgIHZhciB4ID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgIHZhciB5ID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgIG0xWzBdID0geCAqIG0xMCArIHkgKiBtMTM7XG4gICAgbTFbMV0gPSB4ICogbTExICsgeSAqIG0xNDtcbiAgICBtMVsyXSA9IHggKiBtMTIgKyB5ICogbTE1O1xuICAgIG0xWzNdID0geCAqIG0xMyAtIHkgKiBtMTA7XG4gICAgbTFbNF0gPSB4ICogbTE0IC0geSAqIG0xMTtcbiAgICBtMVs1XSA9IHggKiBtMTUgLSB5ICogbTEyO1xufTtcbmV4cG9ydHMuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZShtMSwgeCwgeSkge1xuICAgIG0xWzBdICo9IHg7XG4gICAgbTFbMV0gKj0geDtcbiAgICBtMVsyXSAqPSB4O1xuICAgIG0xWzNdICo9IHk7XG4gICAgbTFbNF0gKj0geTtcbiAgICBtMVs1XSAqPSB5O1xufTtcbmV4cG9ydHMudHJhbnNmb3JtID0gZnVuY3Rpb24gdHJhbnNmb3JtKG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSkge1xuICAgIG0xWzBdICo9IG0xMTtcbiAgICBtMVsxXSAqPSBtMjE7XG4gICAgbTFbMl0gKj0gZHg7XG4gICAgbTFbM10gKj0gbTEyO1xuICAgIG0xWzRdICo9IG0yMjtcbiAgICBtMVs1XSAqPSBkeTtcbiAgICBtMVs2XSA9IDA7XG4gICAgbTFbN10gPSAwO1xufTtcbmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gc2V0VHJhbnNmb3JtKG0xLCBtMTEsIG0xMiwgbTIxLCBtMjIsIGR4LCBkeSkge1xuICAgIG0xWzBdID0gbTExO1xuICAgIG0xWzFdID0gbTEyO1xuICAgIG0xWzNdID0gbTIxO1xuICAgIG0xWzRdID0gbTIyO1xuICAgIG0xWzZdID0gZHg7XG4gICAgbTFbN10gPSBkeTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vc2V0dGluZ3MnKTtcbmZ1bmN0aW9uIEFic3RyYWN0VmVjdG9yKCkge1xuICAgIHRocm93IEVycm9yKCdDYW5ub3QgY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBhYnN0cmFjdCBjbGFzcyAobmV3IHY2LkFic3RyYWN0VmVjdG9yKScpO1xufVxuQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlID0ge1xuICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24gbm9ybWFsaXplKCkge1xuICAgICAgICB2YXIgbWFnID0gdGhpcy5tYWcoKTtcbiAgICAgICAgaWYgKG1hZyAmJiBtYWcgIT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZGl2KG1hZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXRBbmdsZTogZnVuY3Rpb24gc2V0QW5nbGUoYW5nbGUpIHtcbiAgICAgICAgdmFyIG1hZyA9IHRoaXMubWFnKCk7XG4gICAgICAgIGlmIChzZXR0aW5ncy5kZWdyZWVzKSB7XG4gICAgICAgICAgICBhbmdsZSAqPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueCA9IG1hZyAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdGhpcy55ID0gbWFnICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldE1hZzogZnVuY3Rpb24gc2V0TWFnKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bCh2YWx1ZSk7XG4gICAgfSxcbiAgICByb3RhdGU6IGZ1bmN0aW9uIHJvdGF0ZShhbmdsZSkge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHZhciBjLCBzO1xuICAgICAgICBpZiAoc2V0dGluZ3MuZGVncmVlcykge1xuICAgICAgICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgfVxuICAgICAgICBjID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBzID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICB0aGlzLnggPSB4ICogYyAtIHkgKiBzO1xuICAgICAgICB0aGlzLnkgPSB4ICogcyArIHkgKiBjO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldEFuZ2xlOiBmdW5jdGlvbiBnZXRBbmdsZSgpIHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmRlZ3JlZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMueSwgdGhpcy54KSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCB0aGlzLngpO1xuICAgIH0sXG4gICAgbGltaXQ6IGZ1bmN0aW9uIGxpbWl0KHZhbHVlKSB7XG4gICAgICAgIHZhciBtYWcgPSB0aGlzLm1hZ1NxKCk7XG4gICAgICAgIGlmIChtYWcgPiB2YWx1ZSAqIHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLmRpdihNYXRoLnNxcnQobWFnKSkubXVsKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG1hZzogZnVuY3Rpb24gbWFnKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubWFnU3EoKSk7XG4gICAgfSxcbiAgICBjb25zdHJ1Y3RvcjogQWJzdHJhY3RWZWN0b3Jcbn07XG5BYnN0cmFjdFZlY3Rvci5fZnJvbUFuZ2xlID0gZnVuY3Rpb24gX2Zyb21BbmdsZShWZWN0b3IsIGFuZ2xlKSB7XG4gICAgaWYgKHNldHRpbmdzLmRlZ3JlZXMpIHtcbiAgICAgICAgYW5nbGUgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoTWF0aC5jb3MoYW5nbGUpLCBNYXRoLnNpbihhbmdsZSkpO1xufTtcbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RWZWN0b3I7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vc2V0dGluZ3MnKTtcbnZhciBBYnN0cmFjdFZlY3RvciA9IHJlcXVpcmUoJy4vQWJzdHJhY3RWZWN0b3InKTtcbmZ1bmN0aW9uIFZlY3RvcjJEKHgsIHkpIHtcbiAgICB0aGlzLnNldCh4LCB5KTtcbn1cblZlY3RvcjJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQWJzdHJhY3RWZWN0b3IucHJvdG90eXBlKTtcblZlY3RvcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFZlY3RvcjJEO1xuVmVjdG9yMkQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh4LCB5KSB7XG4gICAgdGhpcy54ID0geCB8fCAwO1xuICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHgsIHkpIHtcbiAgICB0aGlzLnggKz0geCB8fCAwO1xuICAgIHRoaXMueSArPSB5IHx8IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVmVjdG9yMkQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIHN1Yih4LCB5KSB7XG4gICAgdGhpcy54IC09IHggfHwgMDtcbiAgICB0aGlzLnkgLT0geSB8fCAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5tdWwgPSBmdW5jdGlvbiBtdWwodmFsdWUpIHtcbiAgICB0aGlzLnggKj0gdmFsdWU7XG4gICAgdGhpcy55ICo9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYodmFsdWUpIHtcbiAgICB0aGlzLnggLz0gdmFsdWU7XG4gICAgdGhpcy55IC89IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QoeCwgeSkge1xuICAgIHJldHVybiB0aGlzLnggKiAoeCB8fCAwKSArIHRoaXMueSAqICh5IHx8IDApO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKHgsIHksIHZhbHVlKSB7XG4gICAgdGhpcy54ICs9ICh4IC0gdGhpcy54KSAqIHZhbHVlIHx8IDA7XG4gICAgdGhpcy55ICs9ICh5IC0gdGhpcy55KSAqIHZhbHVlIHx8IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVmVjdG9yMkQucHJvdG90eXBlLnNldFZlY3RvciA9IGZ1bmN0aW9uIHNldFZlY3Rvcih2ZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQodmVjdG9yLngsIHZlY3Rvci55KTtcbn07XG5WZWN0b3IyRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yKHZlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLmFkZCh2ZWN0b3IueCwgdmVjdG9yLnkpO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5zdWJWZWN0b3IgPSBmdW5jdGlvbiBzdWJWZWN0b3IodmVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuc3ViKHZlY3Rvci54LCB2ZWN0b3IueSk7XG59O1xuVmVjdG9yMkQucHJvdG90eXBlLm11bFZlY3RvciA9IGZ1bmN0aW9uIG11bFZlY3Rvcih2ZWN0b3IpIHtcbiAgICB0aGlzLnggKj0gdmVjdG9yLng7XG4gICAgdGhpcy55ICo9IHZlY3Rvci55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IodmVjdG9yKSB7XG4gICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IyRC5wcm90b3R5cGUuZG90VmVjdG9yID0gZnVuY3Rpb24gZG90VmVjdG9yKHZlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLmRvdCh2ZWN0b3IueCwgdmVjdG9yLnkpO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5sZXJwVmVjdG9yID0gZnVuY3Rpb24gbGVycFZlY3Rvcih2ZWN0b3IsIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMubGVycCh2ZWN0b3IueCwgdmVjdG9yLnksIHZhbHVlKTtcbn07XG5WZWN0b3IyRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSgpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yMkQodGhpcy54LCB0aGlzLnkpO1xufTtcblZlY3RvcjJELnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24gZGlzdCh2ZWN0b3IpIHtcbiAgICB2YXIgeCA9IHZlY3Rvci54IC0gdGhpcy54O1xuICAgIHZhciB5ID0gdmVjdG9yLnkgLSB0aGlzLnk7XG4gICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbn07XG5WZWN0b3IyRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gJ3Y2LlZlY3RvcjJEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKDIpICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKDIpICsgJyB9Jztcbn07XG5WZWN0b3IyRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20oKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmIChzZXR0aW5ncy5kZWdyZWVzKSB7XG4gICAgICAgIHZhbHVlID0gMzYwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gTWF0aC5QSSAqIDI7XG4gICAgfVxuICAgIHJldHVybiBWZWN0b3IyRC5mcm9tQW5nbGUoTWF0aC5yYW5kb20oKSAqIHZhbHVlKTtcbn07XG5WZWN0b3IyRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUoYW5nbGUpIHtcbiAgICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZShWZWN0b3IyRCwgYW5nbGUpO1xufTtcbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yMkQ7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIEFic3RyYWN0VmVjdG9yID0gcmVxdWlyZSgnLi9BYnN0cmFjdFZlY3RvcicpO1xuZnVuY3Rpb24gVmVjdG9yM0QoeCwgeSwgeikge1xuICAgIHRoaXMuc2V0KHgsIHksIHopO1xufVxuVmVjdG9yM0QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBYnN0cmFjdFZlY3Rvci5wcm90b3R5cGUpO1xuVmVjdG9yM0QucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVmVjdG9yM0Q7XG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHgsIHksIHopIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xuICAgIHRoaXMueiA9IHogfHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHgsIHksIHopIHtcbiAgICB0aGlzLnggKz0geCB8fCAwO1xuICAgIHRoaXMueSArPSB5IHx8IDA7XG4gICAgdGhpcy56ICs9IHogfHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViKHgsIHksIHopIHtcbiAgICB0aGlzLnggLT0geCB8fCAwO1xuICAgIHRoaXMueSAtPSB5IHx8IDA7XG4gICAgdGhpcy56IC09IHogfHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24gbXVsKHZhbHVlKSB7XG4gICAgdGhpcy54ICo9IHZhbHVlO1xuICAgIHRoaXMueSAqPSB2YWx1ZTtcbiAgICB0aGlzLnogKj0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVmVjdG9yM0QucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdih2YWx1ZSkge1xuICAgIHRoaXMueCAvPSB2YWx1ZTtcbiAgICB0aGlzLnkgLz0gdmFsdWU7XG4gICAgdGhpcy56IC89IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjNELnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QoeCwgeSwgeikge1xuICAgIHJldHVybiB0aGlzLnggKiAoeCB8fCAwKSArIHRoaXMueSAqICh5IHx8IDApICsgdGhpcy56ICogKHogfHwgMCk7XG59O1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoeCwgeSwgeiwgdmFsdWUpIHtcbiAgICB0aGlzLnggKz0gKHggLSB0aGlzLngpICogdmFsdWUgfHwgMDtcbiAgICB0aGlzLnkgKz0gKHkgLSB0aGlzLnkpICogdmFsdWUgfHwgMDtcbiAgICB0aGlzLnogKz0gKHogLSB0aGlzLnopICogdmFsdWUgfHwgMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUuc2V0VmVjdG9yID0gZnVuY3Rpb24gc2V0VmVjdG9yKHZlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLnNldCh2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56KTtcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gYWRkVmVjdG9yKHZlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLmFkZCh2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56KTtcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUuc3ViVmVjdG9yID0gZnVuY3Rpb24gc3ViVmVjdG9yKHZlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLnN1Yih2ZWN0b3IueCwgdmVjdG9yLnksIHZlY3Rvci56KTtcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUubXVsVmVjdG9yID0gZnVuY3Rpb24gbXVsVmVjdG9yKHZlY3Rvcikge1xuICAgIHRoaXMueCAqPSB2ZWN0b3IueDtcbiAgICB0aGlzLnkgKj0gdmVjdG9yLnk7XG4gICAgdGhpcy56ICo9IHZlY3Rvci56O1xuICAgIHJldHVybiB0aGlzO1xufTtcblZlY3RvcjNELnByb3RvdHlwZS5kaXZWZWN0b3IgPSBmdW5jdGlvbiBkaXZWZWN0b3IodmVjdG9yKSB7XG4gICAgdGhpcy54IC89IHZlY3Rvci54O1xuICAgIHRoaXMueSAvPSB2ZWN0b3IueTtcbiAgICB0aGlzLnogLz0gdmVjdG9yLno7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVmVjdG9yM0QucHJvdG90eXBlLmRvdFZlY3RvciA9IGZ1bmN0aW9uIGRvdFZlY3Rvcih2ZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5kb3QodmVjdG9yLngsIHZlY3Rvci55LCB2ZWN0b3Iueik7XG59O1xuVmVjdG9yM0QucHJvdG90eXBlLmxlcnBWZWN0b3IgPSBmdW5jdGlvbiBsZXJwVmVjdG9yKHZlY3RvciwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5sZXJwKHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnosIHZhbHVlKTtcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUubWFnU3EgPSBmdW5jdGlvbiBtYWdTcSgpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56O1xufTtcblZlY3RvcjNELnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yM0QodGhpcy54LCB0aGlzLnksIHRoaXMueik7XG59O1xuVmVjdG9yM0QucHJvdG90eXBlLmRpc3QgPSBmdW5jdGlvbiBkaXN0KHZlY3Rvcikge1xuICAgIHZhciB4ID0gdmVjdG9yLnggLSB0aGlzLng7XG4gICAgdmFyIHkgPSB2ZWN0b3IueSAtIHRoaXMueTtcbiAgICB2YXIgeiA9IHZlY3Rvci56IC0gdGhpcy56O1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbn07XG5WZWN0b3IzRC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gJ3Y2LlZlY3RvcjNEIHsgeDogJyArIHRoaXMueC50b0ZpeGVkKDIpICsgJywgeTogJyArIHRoaXMueS50b0ZpeGVkKDIpICsgJywgejogJyArIHRoaXMuei50b0ZpeGVkKDIpICsgJyB9Jztcbn07XG5WZWN0b3IzRC5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20oKSB7XG4gICAgdmFyIHRoZXRhID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICAgIHZhciB6ID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xuICAgIHZhciBuID0gTWF0aC5zcXJ0KDEgLSB6ICogeik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IzRChuICogTWF0aC5jb3ModGhldGEpLCBuICogTWF0aC5zaW4odGhldGEpLCB6KTtcbn07XG5WZWN0b3IzRC5mcm9tQW5nbGUgPSBmdW5jdGlvbiBmcm9tQW5nbGUoYW5nbGUpIHtcbiAgICByZXR1cm4gQWJzdHJhY3RWZWN0b3IuX2Zyb21BbmdsZShWZWN0b3IzRCwgYW5nbGUpO1xufTtcbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yM0Q7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdldEVsZW1lbnRXID0gcmVxdWlyZSgncGVha28vZ2V0LWVsZW1lbnQtdycpO1xudmFyIGdldEVsZW1lbnRIID0gcmVxdWlyZSgncGVha28vZ2V0LWVsZW1lbnQtaCcpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xudmFyIGNyZWF0ZVBvbHlnb24gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVfcG9seWdvbicpO1xudmFyIHBvbHlnb25zID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcG9seWdvbnMnKTtcbnZhciBzZXREZWZhdWx0RHJhd2luZ1NldHRpbmdzID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9zZXRfZGVmYXVsdF9kcmF3aW5nX3NldHRpbmdzJyk7XG52YXIgZ2V0V2ViR0wgPSByZXF1aXJlKCcuL2ludGVybmFsL2dldF93ZWJnbCcpO1xudmFyIGNvcHlEcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCcuL2ludGVybmFsL2NvcHlfZHJhd2luZ19zZXR0aW5ncycpO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25YID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nKS5wcm9jZXNzUmVjdEFsaWduWDtcbnZhciBwcm9jZXNzUmVjdEFsaWduWSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvcHJvY2Vzc19yZWN0X2FsaWduJykucHJvY2Vzc1JlY3RBbGlnblk7XG52YXIgb3B0aW9ucyA9IHJlcXVpcmUoJy4vc2V0dGluZ3MnKTtcbmZ1bmN0aW9uIEFic3RyYWN0UmVuZGVyZXIoKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGFic3RyYWN0IGNsYXNzIChuZXcgdjYuQWJzdHJhY3RSZW5kZXJlciknKTtcbn1cbkFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgIGFwcGVuZFRvOiBmdW5jdGlvbiBhcHBlbmRUbyhwYXJlbnQpIHtcbiAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhY2tbKyt0aGlzLl9zdGFja0luZGV4XSkge1xuICAgICAgICAgICAgY29weURyYXdpbmdTZXR0aW5ncyh0aGlzLl9zdGFja1t0aGlzLl9zdGFja0luZGV4XSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFjay5wdXNoKHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3Moe30sIHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHBvcDogZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhY2tJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICBjb3B5RHJhd2luZ1NldHRpbmdzKHRoaXMsIHRoaXMuX3N0YWNrW3RoaXMuX3N0YWNrSW5kZXgtLV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlc2l6ZTogZnVuY3Rpb24gcmVzaXplKHcsIGgpIHtcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xuICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICAgICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICAgICAgICBjYW52YXMud2lkdGggPSB0aGlzLncgPSBNYXRoLmZsb29yKHcgKiBzY2FsZSk7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmggPSBNYXRoLmZsb29yKGggKiBzY2FsZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVzaXplVG86IGZ1bmN0aW9uIHJlc2l6ZVRvKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzaXplKGdldEVsZW1lbnRXKGVsZW1lbnQpLCBnZXRFbGVtZW50SChlbGVtZW50KSk7XG4gICAgfSxcbiAgICBkcmF3UG9seWdvbjogZnVuY3Rpb24gZHJhd1BvbHlnb24oeCwgeSwgeFJhZGl1cywgeVJhZGl1cywgc2lkZXMsIHJvdGF0aW9uQW5nbGUsIGRlZ3JlZXMpIHtcbiAgICAgICAgdmFyIHBvbHlnb24gPSBwb2x5Z29uc1tzaWRlc107XG4gICAgICAgIGlmICghcG9seWdvbikge1xuICAgICAgICAgICAgcG9seWdvbiA9IHBvbHlnb25zW3NpZGVzXSA9IGNyZWF0ZVBvbHlnb24oc2lkZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWdyZWVzKSB7XG4gICAgICAgICAgICByb3RhdGlvbkFuZ2xlICo9IE1hdGguUEkgLyAxODA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXRyaXguc2F2ZSgpO1xuICAgICAgICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICAgIHRoaXMubWF0cml4LnJvdGF0ZShyb3RhdGlvbkFuZ2xlKTtcbiAgICAgICAgdGhpcy5kcmF3QXJyYXlzKHBvbHlnb24sIHBvbHlnb24ubGVuZ3RoICogMC41LCBudWxsLCB4UmFkaXVzLCB5UmFkaXVzKTtcbiAgICAgICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHBvbHlnb246IGZ1bmN0aW9uIHBvbHlnb24oeCwgeSwgciwgc2lkZXMsIHJvdGF0aW9uQW5nbGUpIHtcbiAgICAgICAgaWYgKHNpZGVzICUgMSkge1xuICAgICAgICAgICAgc2lkZXMgPSBNYXRoLmZsb29yKHNpZGVzICogMTAwKSAqIDAuMDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3RhdGlvbkFuZ2xlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5kcmF3UG9seWdvbih4LCB5LCByLCByLCBzaWRlcywgLU1hdGguUEkgKiAwLjUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3UG9seWdvbih4LCB5LCByLCByLCBzaWRlcywgcm90YXRpb25BbmdsZSwgb3B0aW9ucy5kZWdyZWVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGltYWdlOiBmdW5jdGlvbiBpbWFnZShpbWFnZSwgeCwgeSwgdywgaCkge1xuICAgICAgICBpZiAoaW1hZ2UuZ2V0KCkubG9hZGVkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHcgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdyA9IGltYWdlLmR3O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBoID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGggPSBpbWFnZS5kaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHggPSBwcm9jZXNzUmVjdEFsaWduWCh0aGlzLCB4LCB3KTtcbiAgICAgICAgICAgIHggPSBwcm9jZXNzUmVjdEFsaWduWSh0aGlzLCB5LCBoKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0ltYWdlKGltYWdlLCB4LCB5LCB3LCBoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGJlZ2luU2hhcGU6IGZ1bmN0aW9uIGJlZ2luU2hhcGUob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl92ZXJ0aWNlcy5sZW5ndGggPSAwO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX3NoYXBlVHlwZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zaGFwZVR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB2ZXJ0ZXg6IGZ1bmN0aW9uIHZlcnRleCh4LCB5KSB7XG4gICAgICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2goTWF0aC5mbG9vcih4KSwgTWF0aC5mbG9vcih5KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZW5kU2hhcGU6IGZ1bmN0aW9uIGVuZFNoYXBlKCkge1xuICAgICAgICB0aHJvdyBFcnJvcignbm90IGltcGVtZW50ZWQgbm93Jyk7XG4gICAgfSxcbiAgICBzYXZlOiBmdW5jdGlvbiBzYXZlKCkge1xuICAgICAgICB0aGlzLm1hdHJpeC5zYXZlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSgpIHtcbiAgICAgICAgdGhpcy5tYXRyaXgucmVzdG9yZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldFRyYW5zZm9ybTogZnVuY3Rpb24gc2V0VHJhbnNmb3JtKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KSB7XG4gICAgICAgIHZhciBwb3NpdGlvbiwgem9vbTtcbiAgICAgICAgaWYgKHR5cGVvZiBtMTEgPT09ICdvYmplY3QnICYmIG0xMSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBtMTEucG9zaXRpb247XG4gICAgICAgICAgICB6b29tID0gbTExLnpvb207XG4gICAgICAgICAgICB0aGlzLm1hdHJpeC5zZXRUcmFuc2Zvcm0oem9vbSwgMCwgMCwgem9vbSwgcG9zaXRpb25bMF0gKiB6b29tLCBwb3NpdGlvblsxXSAqIHpvb20pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tYXRyaXguc2V0VHJhbnNmb3JtKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24gdHJhbnNsYXRlKHgsIHkpIHtcbiAgICAgICAgdGhpcy5tYXRyaXgudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJvdGF0ZTogZnVuY3Rpb24gcm90YXRlKGFuZ2xlKSB7XG4gICAgICAgIHRoaXMubWF0cml4LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2NhbGU6IGZ1bmN0aW9uIHNjYWxlKHgsIHkpIHtcbiAgICAgICAgdGhpcy5tYXRyaXguc2NhbGUoeCwgeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgdHJhbnNmb3JtOiBmdW5jdGlvbiB0cmFuc2Zvcm0obTExLCBtMTIsIG0yMSwgbTIyLCBkeCwgZHkpIHtcbiAgICAgICAgdGhpcy5tYXRyaXgudHJhbnNmb3JtKG0xMSwgbTEyLCBtMjEsIG0yMiwgZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBsaW5lV2lkdGg6IGZ1bmN0aW9uIGxpbmVXaWR0aChudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbGluZVdpZHRoID0gbnVtYmVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGJhY2tncm91bmRQb3NpdGlvblg6IGZ1bmN0aW9uIGJhY2tncm91bmRQb3NpdGlvblgodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlICE9PSBjb25zdGFudHMuZ2V0KCdWQUxVRScpKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gY29uc3RhbnRzLmdldCgnQ09OU1RBTlQnKSkge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBjb25zdGFudHMuZ2V0KCdQRVJDRU5UJyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCdMRUZUJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IGNvbnN0YW50cy5nZXQoJ0NFTlRFUicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gMC41O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IGNvbnN0YW50cy5nZXQoJ1JJR0hUJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdHb3QgdW5rbm93biB2YWx1ZS4gVGhlIGtub3duIGFyZTogJyArICdMRUZUJyArICcsICcgKyAnQ0VOVEVSJyArICcsICcgKyAnUklHSFQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gY29uc3RhbnRzLmdldCgnUEVSQ0VOVCcpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgKj0gdGhpcy53O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignR290IHVua25vd24gYHZhbHVlYCB0eXBlLiBUaGUga25vd24gYXJlOiBWQUxVRSwgUEVSQ0VOVCwgQ09OU1RBTlQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9iYWNrZ3JvdW5kUG9zaXRpb25YID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgYmFja2dyb3VuZFBvc2l0aW9uWTogZnVuY3Rpb24gYmFja2dyb3VuZFBvc2l0aW9uWSh2YWx1ZSwgdHlwZSkge1xuICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGUgIT09IGNvbnN0YW50cy5nZXQoJ1ZBTFVFJykpIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBjb25zdGFudHMuZ2V0KCdDT05TVEFOVCcpKSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9IGNvbnN0YW50cy5nZXQoJ1BFUkNFTlQnKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGNvbnN0YW50cy5nZXQoJ1RPUCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCdNSURETEUnKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IDAuNTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCdCT1RUT00nKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0dvdCB1bmtub3duIHZhbHVlLiBUaGUga25vd24gYXJlOiAnICsgJ1RPUCcgKyAnLCAnICsgJ01JRERMRScgKyAnLCAnICsgJ0JPVFRPTScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlID09PSBjb25zdGFudHMuZ2V0KCdQRVJDRU5UJykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSAqPSB0aGlzLmg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdHb3QgdW5rbm93biBgdmFsdWVgIHR5cGUuIFRoZSBrbm93biBhcmU6IFZBTFVFLCBQRVJDRU5ULCBDT05TVEFOVCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2JhY2tncm91bmRQb3NpdGlvblkgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZWN0QWxpZ25YOiBmdW5jdGlvbiByZWN0QWxpZ25YKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCgnTEVGVCcpIHx8IHZhbHVlID09PSBjb25zdGFudHMuZ2V0KCdDRU5URVInKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCgnUklHSFQnKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVjdEFsaWduWCA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0dvdCB1bmtub3duIGByZWN0QWxpZ25gIGNvbnN0YW50LiBUaGUga25vd24gYXJlOiAnICsgJ0xFRlQnICsgJywgJyArICdDRU5URVInICsgJywgJyArICdSSUdIVCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVjdEFsaWduWTogZnVuY3Rpb24gcmVjdEFsaWduWSh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IGNvbnN0YW50cy5nZXQoJ0xFRlQnKSB8fCB2YWx1ZSA9PT0gY29uc3RhbnRzLmdldCgnQ0VOVEVSJykgfHwgdmFsdWUgPT09IGNvbnN0YW50cy5nZXQoJ1JJR0hUJykpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY3RBbGlnblkgPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdHb3QgdW5rbm93biBgcmVjdEFsaWduYCBjb25zdGFudC4gVGhlIGtub3duIGFyZTogJyArICdUT1AnICsgJywgJyArICdNSURETEUnICsgJywgJyArICdCT1RUT00nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHN0cm9rZTogZnVuY3Rpb24gc3Ryb2tlKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5fc3Ryb2tlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgdGhpcy5fZG9TdHJva2UgPSByO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0aGlzLl9zdHJva2VDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHJva2VDb2xvciA9IG5ldyB0aGlzLnNldHRpbmdzLmNvbG9yKHIsIGcsIGIsIGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHJva2VDb2xvci5zZXQociwgZywgYiwgYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kb1N0cm9rZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBmaWxsOiBmdW5jdGlvbiBmaWxsKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5fZmlsbCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHRoaXMuX2RvRmlsbCA9IHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHRoaXMuX2ZpbGxDb2xvci50eXBlICE9PSB0aGlzLnNldHRpbmdzLmNvbG9yLnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxsQ29sb3IgPSBuZXcgdGhpcy5zZXR0aW5ncy5jb2xvcihyLCBnLCBiLCBhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsbENvbG9yLnNldChyLCBnLCBiLCBhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2RvRmlsbCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBub1N0cm9rZTogZnVuY3Rpb24gbm9TdHJva2UoKSB7XG4gICAgICAgIHRoaXMuX2RvU3Ryb2tlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgbm9GaWxsOiBmdW5jdGlvbiBub0ZpbGwoKSB7XG4gICAgICAgIHRoaXMuX2RvRmlsbCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbnN0cnVjdG9yOiBBYnN0cmFjdFJlbmRlcmVyXG59O1xuQWJzdHJhY3RSZW5kZXJlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoc2VsZiwgb3B0aW9ucywgdHlwZSkge1xuICAgIHZhciBjb250ZXh0O1xuICAgIGlmIChvcHRpb25zLmNhbnZhcykge1xuICAgICAgICBzZWxmLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHNlbGYuY2FudmFzLmlubmVySFRNTCA9ICdVbmFibGUgdG8gcnVuIHRoaXMgYXBwbGljYXRpb24uJztcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IGNvbnN0YW50cy5nZXQoJzJEJykpIHtcbiAgICAgICAgY29udGV4dCA9ICcyZCc7XG4gICAgfSBlbHNlIGlmICh0eXBlICE9PSBjb25zdGFudHMuZ2V0KCdHTCcpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdHb3QgdW5rbm93biByZW5kZXJlciB0eXBlLiBUaGUga25vd24gYXJlOiAyRCBhbmQgR0wnKTtcbiAgICB9IGVsc2UgaWYgKCEoY29udGV4dCA9IGdldFdlYkdMKCkpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgZ2V0IFdlYkdMIGNvbnRleHQuIFRyeSB0byB1c2UgMkQgYXMgdGhlIHJlbmRlcmVyIHR5cGUgb3IgdjYuUmVuZGVyZXIyRCBpbnN0ZWFkIG9mIHY2LlJlbmRlcmVyR0wnKTtcbiAgICB9XG4gICAgc2VsZi5jb250ZXh0ID0gc2VsZi5jYW52YXMuZ2V0Q29udGV4dChjb250ZXh0LCB7IGFscGhhOiBvcHRpb25zLmFscGhhIH0pO1xuICAgIHNlbGYuc2V0dGluZ3MgPSBvcHRpb25zLnNldHRpbmdzO1xuICAgIHNlbGYudHlwZSA9IHR5cGU7XG4gICAgc2VsZi5fc3RhY2sgPSBbXTtcbiAgICBzZWxmLl9zdGFja0luZGV4ID0gLTE7XG4gICAgc2VsZi5fdmVydGljZXMgPSBbXTtcbiAgICBzZWxmLl9zaGFwZVR5cGUgPSBudWxsO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hcHBlbmRUbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VsZi5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuYXBwZW5kVG8gIT09IG51bGwpIHtcbiAgICAgICAgc2VsZi5hcHBlbmRUbyhvcHRpb25zLmFwcGVuZFRvKTtcbiAgICB9XG4gICAgaWYgKCd3JyBpbiBvcHRpb25zIHx8ICdoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgIHNlbGYucmVzaXplKG9wdGlvbnMudyB8fCAwLCBvcHRpb25zLmggfHwgMCk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmFwcGVuZFRvICE9PSBudWxsKSB7XG4gICAgICAgIHNlbGYucmVzaXplVG8ob3B0aW9ucy5hcHBlbmRUbyB8fCBkb2N1bWVudC5ib2R5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnJlc2l6ZSg2MDAsIDQwMCk7XG4gICAgfVxuICAgIHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3Moc2VsZiwgc2VsZik7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdFJlbmRlcmVyOyIsIid1c2Ugc3RyaWN0JztcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ3BlYWtvL2RlZmF1bHRzJyk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzJyk7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicpLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nKS5wcm9jZXNzUmVjdEFsaWduWTtcbnZhciBBYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSgnLi9BYnN0cmFjdFJlbmRlcmVyJyk7XG52YXIgb3B0aW9uc18gPSByZXF1aXJlKCcuL3NldHRpbmdzJyk7XG5mdW5jdGlvbiBSZW5kZXJlcjJEKG9wdGlvbnMpIHtcbiAgICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSh0aGlzLCBvcHRpb25zID0gZGVmYXVsdHMob3B0aW9uc18sIG9wdGlvbnMpLCBjb25zdGFudHMuZ2V0KCcyRCcpKTtcbiAgICB0aGlzLm1hdHJpeCA9IHRoaXMuY29udGV4dDtcbn1cblJlbmRlcmVyMkQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSk7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyMkQ7XG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kQ29sb3IgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IociwgZywgYiwgYSkge1xuICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSBuZXcgc2V0dGluZ3MuY29sb3IociwgZywgYiwgYSk7XG4gICAgY29udGV4dC5zZXRUcmFuc2Zvcm0oc2V0dGluZ3Muc2NhbGUsIDAsIDAsIHNldHRpbmdzLnNjYWxlLCAwLCAwKTtcbiAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMudywgdGhpcy5oKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5SZW5kZXJlcjJELnByb3RvdHlwZS5iYWNrZ3JvdW5kSW1hZ2UgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kSW1hZ2UoaW1hZ2UpIHtcbiAgICB2YXIgX3JlY3RBbGlnblggPSB0aGlzLl9yZWN0QWxpZ25YO1xuICAgIHZhciBfcmVjdEFsaWduWSA9IHRoaXMuX3JlY3RBbGlnblk7XG4gICAgdGhpcy5fcmVjdEFsaWduWCA9IGNvbnN0YW50cy5nZXQoJ0NFTlRFUicpO1xuICAgIHRoaXMuX3JlY3RBbGlnblkgPSBjb25zdGFudHMuZ2V0KCdNSURETEUnKTtcbiAgICB0aGlzLmltYWdlKGltYWdlLCB0aGlzLncgKiAwLjUsIHRoaXMuaCAqIDAuNSk7XG4gICAgdGhpcy5fcmVjdEFsaWduWCA9IF9yZWN0QWxpZ25YO1xuICAgIHRoaXMuX3JlY3RBbGlnblkgPSBfcmVjdEFsaWduWTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5SZW5kZXJlcjJELnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMuY29udGV4dC5jbGVhcigwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXModmVydHMsIGNvdW50LCBfbW9kZSwgX3N4LCBfc3kpIHtcbiAgICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICB2YXIgaTtcbiAgICBpZiAoY291bnQgPCAyKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIF9zeCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgX3N4ID0gX3N5ID0gMTtcbiAgICB9XG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBjb250ZXh0Lm1vdmVUbyh2ZXJ0c1swXSAqIF9zeCwgdmVydHNbMV0gKiBfc3kpO1xuICAgIGZvciAoaSA9IDIsIGNvdW50ICo9IDI7IGkgPCBjb3VudDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnRleHQubGluZVRvKHZlcnRzW2ldICogX3N4LCB2ZXJ0c1tpICsgMV0gKiBfc3kpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fZG9GaWxsKSB7XG4gICAgICAgIHRoaXMuX2ZpbGwoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2RvU3Ryb2tlICYmIHRoaXMuX2xpbmVXaWR0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fc3Ryb2tlKHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5SZW5kZXJlcjJELnByb3RvdHlwZS5kcmF3SW1hZ2UgPSBmdW5jdGlvbiBkcmF3SW1hZ2UoaW1hZ2UsIHgsIHksIHcsIGgpIHtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKGltYWdlLmdldCgpLmltYWdlLCBpbWFnZS54LCBpbWFnZS55LCBpbWFnZS53LCBpbWFnZS5oLCB4LCB5LCB3LCBoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5SZW5kZXJlcjJELnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24gcmVjdCh4LCB5LCB3LCBoKSB7XG4gICAgeCA9IHByb2Nlc3NSZWN0QWxpZ25YKHRoaXMsIHgsIHcpO1xuICAgIHkgPSBwcm9jZXNzUmVjdEFsaWduWSh0aGlzLCB5LCBoKTtcbiAgICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jb250ZXh0LnJlY3QoeCwgeSwgdywgaCk7XG4gICAgaWYgKHRoaXMuX2RvRmlsbCkge1xuICAgICAgICB0aGlzLl9maWxsKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9kb1N0cm9rZSkge1xuICAgICAgICB0aGlzLl9zdHJva2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuUmVuZGVyZXIyRC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjKHgsIHksIHIpIHtcbiAgICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5LCByLCAwLCBNYXRoLlBJICogMik7XG4gICAgaWYgKHRoaXMuX2RvRmlsbCkge1xuICAgICAgICB0aGlzLl9maWxsKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9kb1N0cm9rZSkge1xuICAgICAgICB0aGlzLl9zdHJva2UodHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblJlbmRlcmVyMkQucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwoKSB7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2ZpbGxDb2xvcjtcbiAgICB0aGlzLmNvbnRleHQuZmlsbCgpO1xufTtcblJlbmRlcmVyMkQucHJvdG90eXBlLl9zdHJva2UgPSBmdW5jdGlvbiAoY2xvc2UpIHtcbiAgICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBpZiAoY2xvc2UpIHtcbiAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICB9XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuX3N0cm9rZUNvbG9yO1xuICAgIGlmICgoY29udGV4dC5saW5lV2lkdGggPSB0aGlzLl9saW5lV2lkdGgpIDw9IDEpIHtcbiAgICAgICAgY29udGV4dC5zdHJva2UoKTtcbiAgICB9XG4gICAgY29udGV4dC5zdHJva2UoKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyMkQ7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgncGVha28vZGVmYXVsdHMnKTtcbnZhciBTaGFkZXJQcm9ncmFtID0gcmVxdWlyZSgnLi4vU2hhZGVyUHJvZ3JhbScpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL1RyYW5zZm9ybScpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xudmFyIHNoYWRlcnMgPSByZXF1aXJlKCcuLi9zaGFkZXJzJyk7XG52YXIgcHJvY2Vzc1JlY3RBbGlnblggPSByZXF1aXJlKCcuL2ludGVybmFsL3Byb2Nlc3NfcmVjdF9hbGlnbicpLnByb2Nlc3NSZWN0QWxpZ25YO1xudmFyIHByb2Nlc3NSZWN0QWxpZ25ZID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9wcm9jZXNzX3JlY3RfYWxpZ24nKS5wcm9jZXNzUmVjdEFsaWduWTtcbnZhciBBYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSgnLi9BYnN0cmFjdFJlbmRlcmVyJyk7XG52YXIgb3B0aW9uc18gPSByZXF1aXJlKCcuL3NldHRpbmdzJyk7XG52YXIgc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3F1YXJlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXTtcbiAgICAgICAgaWYgKHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KHNxdWFyZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNxdWFyZTtcbiAgICB9KCk7XG5mdW5jdGlvbiBSZW5kZXJlckdMKG9wdGlvbnMpIHtcbiAgICBBYnN0cmFjdFJlbmRlcmVyLmNyZWF0ZSh0aGlzLCBvcHRpb25zID0gZGVmYXVsdHMob3B0aW9uc18sIG9wdGlvbnMpLCBjb25zdGFudHMuZ2V0KCdHTCcpKTtcbiAgICB0aGlzLm1hdHJpeCA9IG5ldyBUcmFuc2Zvcm0oKTtcbiAgICB0aGlzLmJ1ZmZlcnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIoKSxcbiAgICAgICAgc3F1YXJlOiB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKClcbiAgICB9O1xuICAgIHRoaXMuY29udGV4dC5iaW5kQnVmZmVyKHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVycy5zcXVhcmUpO1xuICAgIHRoaXMuY29udGV4dC5idWZmZXJEYXRhKHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHNxdWFyZSwgdGhpcy5jb250ZXh0LlNUQVRJQ19EUkFXKTtcbiAgICB0aGlzLnByb2dyYW1zID0geyBkZWZhdWx0OiBuZXcgU2hhZGVyUHJvZ3JhbShzaGFkZXJzLmJhc2ljLCB0aGlzLmNvbnRleHQpIH07XG4gICAgdGhpcy5ibGVuZGluZyhvcHRpb25zLmJsZW5kaW5nKTtcbn1cblJlbmRlcmVyR0wucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBYnN0cmFjdFJlbmRlcmVyLnByb3RvdHlwZSk7XG5SZW5kZXJlckdMLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlbmRlcmVyR0w7XG5SZW5kZXJlckdMLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiByZXNpemUodywgaCkge1xuICAgIEFic3RyYWN0UmVuZGVyZXIucHJvdG90eXBlLnJlc2l6ZS5jYWxsKHRoaXMsIHcsIGgpO1xuICAgIHRoaXMuY29udGV4dC52aWV3cG9ydCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYmxlbmRpbmcgPSBmdW5jdGlvbiBibGVuZGluZyhibGVuZGluZykge1xuICAgIHZhciBnbCA9IHRoaXMuY29udGV4dDtcbiAgICBpZiAoYmxlbmRpbmcpIHtcbiAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgZ2wuZGlzYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG4gICAgICAgIGdsLmJsZW5kRXF1YXRpb24oZ2wuRlVOQ19BREQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5SZW5kZXJlckdMLnByb3RvdHlwZS5fY2xlYXIgPSBmdW5jdGlvbiBfY2xlYXIociwgZywgYiwgYSkge1xuICAgIHZhciBnbCA9IHRoaXMuY29udGV4dDtcbiAgICBnbC5jbGVhckNvbG9yKHIsIGcsIGIsIGEpO1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbn07XG5SZW5kZXJlckdMLnByb3RvdHlwZS5iYWNrZ3JvdW5kQ29sb3IgPSBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IociwgZywgYiwgYSkge1xuICAgIHZhciByZ2JhID0gbmV3IHRoaXMuc2V0dGluZ3MuY29sb3IociwgZywgYiwgYSkucmdiYSgpO1xuICAgIHRoaXMuX2NsZWFyKHJnYmFbMF0gLyAyNTUsIHJnYmFbMV0gLyAyNTUsIHJnYmFbMl0gLyAyNTUsIHJnYmFbM10pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblJlbmRlcmVyR0wucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdGhpcy5fY2xlYXIoMCwgMCwgMCwgMCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuZHJhd0FycmF5cyA9IGZ1bmN0aW9uIGRyYXdBcnJheXModmVydHMsIGNvdW50LCBtb2RlLCBfc3gsIF9zeSkge1xuICAgIHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtcy5kZWZhdWx0O1xuICAgIHZhciBnbCA9IHRoaXMuY29udGV4dDtcbiAgICBpZiAoY291bnQgPCAyKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodmVydHMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2RlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbW9kZSA9IGdsLlNUQVRJQ19EUkFXO1xuICAgICAgICB9XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMuZGVmYXVsdCk7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0cywgbW9kZSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgX3N4ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLm1hdHJpeC5zY2FsZShfc3gsIF9zeSk7XG4gICAgfVxuICAgIHByb2dyYW0udXNlKCkuc2V0VW5pZm9ybSgndXRyYW5zZm9ybScsIHRoaXMubWF0cml4Lm1hdHJpeCkuc2V0VW5pZm9ybSgndXJlcycsIFtcbiAgICAgICAgdGhpcy53LFxuICAgICAgICB0aGlzLmhcbiAgICBdKS5wb2ludGVyKCdhcG9zJywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICB0aGlzLl9maWxsKGNvdW50KTtcbiAgICB0aGlzLl9zdHJva2UoY291bnQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblJlbmRlcmVyR0wucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24gX2ZpbGwoY291bnQpIHtcbiAgICBpZiAodGhpcy5fZG9GaWxsKSB7XG4gICAgICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCd1Y29sb3InLCB0aGlzLl9maWxsQ29sb3IucmdiYSgpKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdBcnJheXModGhpcy5jb250ZXh0LlRSSUFOR0xFX0ZBTiwgMCwgY291bnQpO1xuICAgIH1cbn07XG5SZW5kZXJlckdMLnByb3RvdHlwZS5fc3Ryb2tlID0gZnVuY3Rpb24gX3N0cm9rZShjb3VudCkge1xuICAgIGlmICh0aGlzLl9kb1N0cm9rZSAmJiB0aGlzLl9saW5lV2lkdGggPiAwKSB7XG4gICAgICAgIHRoaXMucHJvZ3JhbXMuZGVmYXVsdC5zZXRVbmlmb3JtKCd1Y29sb3InLCB0aGlzLl9zdHJva2VDb2xvci5yZ2JhKCkpO1xuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoKHRoaXMuX2xpbmVXaWR0aCk7XG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3QXJyYXlzKHRoaXMuY29udGV4dC5MSU5FX0xPT1AsIDAsIGNvdW50KTtcbiAgICB9XG59O1xuUmVuZGVyZXJHTC5wcm90b3R5cGUuYXJjID0gZnVuY3Rpb24gYXJjKHgsIHksIHIpIHtcbiAgICByZXR1cm4gdGhpcy5fcG9seWdvbih4LCB5LCByLCByLCAyNCwgMCk7XG59O1xuUmVuZGVyZXJHTC5wcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uIHJlY3QoeCwgeSwgdywgaCkge1xuICAgIHZhciBhbGlnbmVkWCA9IHByb2Nlc3NSZWN0QWxpZ25YKHRoaXMsIHgsIHcpO1xuICAgIHZhciBhbGlnbmVkWSA9IHByb2Nlc3NSZWN0QWxpZ25ZKHRoaXMsIHksIGgpO1xuICAgIHRoaXMubWF0cml4LnNhdmUoKTtcbiAgICB0aGlzLm1hdHJpeC50cmFuc2xhdGUoYWxpZ25lZFgsIGFsaWduZWRZKTtcbiAgICB0aGlzLm1hdHJpeC5zY2FsZSh3LCBoKTtcbiAgICB0aGlzLmNvbnRleHQuYmluZEJ1ZmZlcih0aGlzLmNvbnRleHQuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcnMucmVjdCk7XG4gICAgdGhpcy5kcmF3QXJyYXlzKG51bGwsIDQpO1xuICAgIHRoaXMubWF0cml4LnJlc3RvcmUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyR0w7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xudmFyIHJlcG9ydCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3JlcG9ydCcpO1xudmFyIGdldFJlbmRlcmVyVHlwZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvZ2V0X3JlbmRlcmVyX3R5cGUnKTtcbnZhciBnZXRXZWJHTCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvZ2V0X3dlYmdsJyk7XG52YXIgUmVuZGVyZXJHTCA9IHJlcXVpcmUoJy4vUmVuZGVyZXJHTCcpO1xudmFyIFJlbmRlcmVyMkQgPSByZXF1aXJlKCcuL1JlbmRlcmVyMkQnKTtcbnZhciB0eXBlID0gcmVxdWlyZSgnLi9zZXR0aW5ncycpLnR5cGU7XG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJlcihvcHRpb25zKSB7XG4gICAgdmFyIHR5cGVfID0gb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgfHwgdHlwZTtcbiAgICBpZiAodHlwZV8gPT09IGNvbnN0YW50cy5nZXQoJ0FVVE8nKSkge1xuICAgICAgICB0eXBlXyA9IGdldFJlbmRlcmVyVHlwZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZV8gPT09IGNvbnN0YW50cy5nZXQoJ0dMJykpIHtcbiAgICAgICAgaWYgKGdldFdlYkdMKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVyZXJHTChvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXBvcnQoJ0Nhbm5vdCBjcmVhdGUgV2ViR0wgY29udGV4dC4gRmFsbGluZyBiYWNrIHRvIDJELicpO1xuICAgIH1cbiAgICBpZiAodHlwZV8gPT09IGNvbnN0YW50cy5nZXQoJzJEJykgfHwgdHlwZV8gPT09IGNvbnN0YW50cy5nZXQoJ0dMJykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJlcjJEKG9wdGlvbnMpO1xuICAgIH1cbiAgICB0aHJvdyBFcnJvcignR290IHVua25vd24gcmVuZGVyZXIgdHlwZS4gVGhlIGtub3duIGFyZTogMkQgYW5kIEdMJyk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJlbmRlcmVyOyIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGNvcHlEcmF3aW5nU2V0dGluZ3ModGFyZ2V0LCBzb3VyY2UsIGRlZXApIHtcbiAgICBpZiAoZGVlcCkge1xuICAgICAgICB0YXJnZXQuX2ZpbGxDb2xvclswXSA9IHNvdXJjZS5fZmlsbENvbG9yWzBdO1xuICAgICAgICB0YXJnZXQuX2ZpbGxDb2xvclsxXSA9IHNvdXJjZS5fZmlsbENvbG9yWzFdO1xuICAgICAgICB0YXJnZXQuX2ZpbGxDb2xvclsyXSA9IHNvdXJjZS5fZmlsbENvbG9yWzJdO1xuICAgICAgICB0YXJnZXQuX2ZpbGxDb2xvclszXSA9IHNvdXJjZS5fZmlsbENvbG9yWzNdO1xuICAgICAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWzBdID0gc291cmNlLl9zdHJva2VDb2xvclswXTtcbiAgICAgICAgdGFyZ2V0Ll9zdHJva2VDb2xvclsxXSA9IHNvdXJjZS5fc3Ryb2tlQ29sb3JbMV07XG4gICAgICAgIHRhcmdldC5fc3Ryb2tlQ29sb3JbMl0gPSBzb3VyY2UuX3N0cm9rZUNvbG9yWzJdO1xuICAgICAgICB0YXJnZXQuX3N0cm9rZUNvbG9yWzNdID0gc291cmNlLl9zdHJva2VDb2xvclszXTtcbiAgICB9XG4gICAgdGFyZ2V0Ll9iYWNrZ3JvdW5kUG9zaXRpb25YID0gc291cmNlLl9iYWNrZ3JvdW5kUG9zaXRpb25YO1xuICAgIHRhcmdldC5fYmFja2dyb3VuZFBvc2l0aW9uWSA9IHNvdXJjZS5fYmFja2dyb3VuZFBvc2l0aW9uWTtcbiAgICB0YXJnZXQuX3JlY3RBbGlnblggPSBzb3VyY2UuX3JlY3RBbGlnblg7XG4gICAgdGFyZ2V0Ll9yZWN0QWxpZ25ZID0gc291cmNlLl9yZWN0QWxpZ25ZO1xuICAgIHRhcmdldC5fbGluZVdpZHRoID0gc291cmNlLl9saW5lV2lkdGg7XG4gICAgdGFyZ2V0Ll9kb1N0cm9rZSA9IHNvdXJjZS5fZG9TdHJva2U7XG4gICAgdGFyZ2V0Ll9kb0ZpbGwgPSBzb3VyY2UuX2RvRmlsbDtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxubW9kdWxlLmV4cG9ydHMgPSBjb3B5RHJhd2luZ1NldHRpbmdzOyIsIid1c2Ugc3RyaWN0JztcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuLi8uLi9jb25zdGFudHMnKTtcbnZhciBkZWZhdWx0RHJhd2luZ1NldHRpbmdzID0ge1xuICAgICAgICBfYmFja2dyb3VuZFBvc2l0aW9uWDogY29uc3RhbnRzLmdldCgnTEVGVCcpLFxuICAgICAgICBfYmFja2dyb3VuZFBvc2l0aW9uWTogY29uc3RhbnRzLmdldCgnVE9QJyksXG4gICAgICAgIF9yZWN0QWxpZ25YOiBjb25zdGFudHMuZ2V0KCdMRUZUJyksXG4gICAgICAgIF9yZWN0QWxpZ25ZOiBjb25zdGFudHMuZ2V0KCdUT1AnKSxcbiAgICAgICAgX2xpbmVXaWR0aDogMixcbiAgICAgICAgX2RvU3Ryb2tlOiB0cnVlLFxuICAgICAgICBfZG9GaWxsOiB0cnVlXG4gICAgfTtcbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdERyYXdpbmdTZXR0aW5nczsiLCIndXNlIHN0cmljdCc7XG52YXIgb25jZSA9IHJlcXVpcmUoJ3BlYWtvL29uY2UnKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuLi8uLi9jb25zdGFudHMnKTtcbmlmICh0eXBlb2YgcGxhdGZvcm0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIHBsYXRmb3JtO1xuICAgIHRyeSB7XG4gICAgICAgIHBsYXRmb3JtID0gcmVxdWlyZSgncGxhdGZvcm0nKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldFJlbmRlcmVyVHlwZSgpIHtcbiAgICB2YXIgc2FmYXJpLCB0b3VjaGFibGU7XG4gICAgaWYgKHBsYXRmb3JtKSB7XG4gICAgICAgIHNhZmFyaSA9IHBsYXRmb3JtLm9zICYmIHBsYXRmb3JtLm9zLmZhbWlseSA9PT0gJ2lPUycgJiYgcGxhdGZvcm0ubmFtZSA9PT0gJ1NhZmFyaSc7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0b3VjaGFibGUgPSAnb250b3VjaGVuZCcgaW4gd2luZG93O1xuICAgIH1cbiAgICBpZiAodG91Y2hhYmxlICYmICFzYWZhcmkpIHtcbiAgICAgICAgcmV0dXJuIGNvbnN0YW50cy5nZXQoJ0dMJyk7XG4gICAgfVxuICAgIHJldHVybiBjb25zdGFudHMuZ2V0KCcyRCcpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBvbmNlKGdldFJlbmRlcmVyVHlwZSk7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIG9uY2UgPSByZXF1aXJlKCdwZWFrby9vbmNlJyk7XG5mdW5jdGlvbiBnZXRXZWJHTCgpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIG5hbWUgPSBudWxsO1xuICAgIGlmIChjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSkge1xuICAgICAgICBuYW1lID0gJ3dlYmdsJztcbiAgICB9IGVsc2UgaWYgKGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKSkge1xuICAgICAgICBuYW1lID0gJ2V4cGVyaW1lbnRhbC13ZWJnbCc7XG4gICAgfVxuICAgIGNhbnZhcyA9IG51bGw7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5tb2R1bGUuZXhwb3J0cyA9IG9uY2UoZ2V0V2ViR0wpOyIsIid1c2Ugc3RyaWN0JztcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuLi8uLi9jb25zdGFudHMnKTtcbmV4cG9ydHMucHJvY2Vzc1JlY3RBbGlnblggPSBmdW5jdGlvbiBwcm9jZXNzUmVjdEFsaWduWChyZW5kZXJlciwgeCwgdykge1xuICAgIGlmIChyZW5kZXJlci5fcmVjdEFsaWduWCA9PT0gY29uc3RhbnRzLmdldCgnQ0VOVEVSJykpIHtcbiAgICAgICAgeCAtPSB3ICogMC41O1xuICAgIH0gZWxzZSBpZiAocmVuZGVyZXIuX3JlY3RBbGlnblggPT09IGNvbnN0YW50cy5nZXQoJ1JJR0hUJykpIHtcbiAgICAgICAgeCAtPSB3O1xuICAgIH0gZWxzZSBpZiAocmVuZGVyZXIuX3JlY3RBbGlnblggIT09IGNvbnN0YW50cy5nZXQoJ0xFRlQnKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignVW5rbm93biBcIiArJyArICdyZWN0QWxpZ25YJyArICdcIjogJyArIHJlbmRlcmVyLl9yZWN0QWxpZ25YKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoeCk7XG59O1xuZXhwb3J0cy5wcm9jZXNzUmVjdEFsaWduWSA9IGZ1bmN0aW9uIHByb2Nlc3NSZWN0QWxpZ25ZKHJlbmRlcmVyLCB4LCB3KSB7XG4gICAgaWYgKHJlbmRlcmVyLl9yZWN0QWxpZ25ZID09PSBjb25zdGFudHMuZ2V0KCdNSURETEUnKSkge1xuICAgICAgICB4IC09IHcgKiAwLjU7XG4gICAgfSBlbHNlIGlmIChyZW5kZXJlci5fcmVjdEFsaWduWSA9PT0gY29uc3RhbnRzLmdldCgnQk9UVE9NJykpIHtcbiAgICAgICAgeCAtPSB3O1xuICAgIH0gZWxzZSBpZiAocmVuZGVyZXIuX3JlY3RBbGlnblkgIT09IGNvbnN0YW50cy5nZXQoJ1RPUCcpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdVbmtub3duIFwiICsnICsgJ3JlY3RBbGlnblknICsgJ1wiOiAnICsgcmVuZGVyZXIuX3JlY3RBbGlnblkpO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5mbG9vcih4KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCcuL2RlZmF1bHRfZHJhd2luZ19zZXR0aW5ncycpO1xudmFyIGNvcHlEcmF3aW5nU2V0dGluZ3MgPSByZXF1aXJlKCcuL2NvcHlfZHJhd2luZ19zZXR0aW5ncycpO1xuZnVuY3Rpb24gc2V0RGVmYXVsdERyYXdpbmdTZXR0aW5ncyh0YXJnZXQsIHJlbmRlcmVyKSB7XG4gICAgY29weURyYXdpbmdTZXR0aW5ncyh0YXJnZXQsIGRlZmF1bHREcmF3aW5nU2V0dGluZ3MpO1xuICAgIHRhcmdldC5fc3Ryb2tlQ29sb3IgPSBuZXcgcmVuZGVyZXIuc2V0dGluZ3MuY29sb3IoKTtcbiAgICB0YXJnZXQuX2ZpbGxDb2xvciA9IG5ldyByZW5kZXJlci5zZXR0aW5ncy5jb2xvcigpO1xuICAgIHJldHVybiB0YXJnZXQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IHNldERlZmF1bHREcmF3aW5nU2V0dGluZ3M7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNvbG9yID0gcmVxdWlyZSgnLi4vY29sb3IvUkdCQScpO1xudmFyIHR5cGUgPSByZXF1aXJlKCcuLi9jb25zdGFudHMnKS5nZXQoJzJEJyk7XG52YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgICAgICAgIHNjYWxlOiAxXG4gICAgICAgIH0sXG4gICAgICAgIGFudGlhbGlhczogdHJ1ZSxcbiAgICAgICAgYmxlbmRpbmc6IHRydWUsXG4gICAgICAgIGRlZ3JlZXM6IGZhbHNlLFxuICAgICAgICBhbHBoYTogdHJ1ZSxcbiAgICAgICAgdHlwZTogdHlwZVxuICAgIH07XG5tb2R1bGUuZXhwb3J0cyA9IG9wdGlvbnM7IiwiJ3VzZSBzdHJpY3QnO1xuZXhwb3J0cy5kZWdyZXNzID0gZmFsc2U7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNoYWRlcnMgPSB7XG4gICAgICAgIGJhc2ljOiB7XG4gICAgICAgICAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt1bmlmb3JtIHZlYzIgdXJlczt1bmlmb3JtIG1hdDMgdXRyYW5zZm9ybTt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbj12ZWM0KCgodXRyYW5zZm9ybSp2ZWMzKGFwb3MsMS4wKSkueHkvdXJlcyoyLjAtMS4wKSp2ZWMyKDEsLTEpLDAsMSk7fScsXG4gICAgICAgICAgICBmcmFnOiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7dW5pZm9ybSB2ZWM0IHVjb2xvcjt2b2lkIG1haW4oKXtnbF9GcmFnQ29sb3I9dmVjNCh1Y29sb3IucmdiLzI1NS4wLHVjb2xvci5hKTt9J1xuICAgICAgICB9LFxuICAgICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgICAgICB2ZXJ0OiAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7YXR0cmlidXRlIHZlYzIgYXBvczt2b2lkIG1haW4oKXtnbF9Qb3NpdGlvbiA9IHZlYzQoYXBvcywwLDEpO30nLFxuICAgICAgICAgICAgZnJhZzogJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O3VuaWZvcm0gdmVjNCB1Y29sb3I7dm9pZCBtYWluKCl7Z2xfRnJhZ0NvbG9yPXVjb2xvcjt9J1xuICAgICAgICB9XG4gICAgfTtcbm1vZHVsZS5leHBvcnRzID0gc2hhZGVyczsiLCIndXNlIHN0cmljdCc7XG5leHBvcnRzLkFic3RyYWN0SW1hZ2UgPSByZXF1aXJlKCcuL2NvcmUvaW1hZ2UvQWJzdHJhY3RJbWFnZScpO1xuZXhwb3J0cy5BYnN0cmFjdFJlbmRlcmVyID0gcmVxdWlyZSgnLi9jb3JlL3JlbmRlcmVyL0Fic3RyYWN0UmVuZGVyZXInKTtcbmV4cG9ydHMuQWJzdHJhY3RWZWN0b3IgPSByZXF1aXJlKCcuL2NvcmUvbWF0aC9BYnN0cmFjdFZlY3RvcicpO1xuZXhwb3J0cy5DYW1lcmEgPSByZXF1aXJlKCcuL2NvcmUvY2FtZXJhL0NhbWVyYScpO1xuZXhwb3J0cy5Db21wb3VuZGVkSW1hZ2UgPSByZXF1aXJlKCcuL2NvcmUvaW1hZ2UvQ29tcG91bmRlZEltYWdlJyk7XG5leHBvcnRzLkhTTEEgPSByZXF1aXJlKCcuL2NvcmUvY29sb3IvSFNMQScpO1xuZXhwb3J0cy5JbWFnZSA9IHJlcXVpcmUoJy4vY29yZS9pbWFnZS9JbWFnZScpO1xuZXhwb3J0cy5SR0JBID0gcmVxdWlyZSgnLi9jb3JlL2NvbG9yL1JHQkEnKTtcbmV4cG9ydHMuUmVuZGVyZXIyRCA9IHJlcXVpcmUoJy4vY29yZS9yZW5kZXJlci9SZW5kZXJlcjJEJyk7XG5leHBvcnRzLlJlbmRlcmVyR0wgPSByZXF1aXJlKCcuL2NvcmUvcmVuZGVyZXIvUmVuZGVyZXJHTCcpO1xuZXhwb3J0cy5TaGFkZXJQcm9ncmFtID0gcmVxdWlyZSgnLi9jb3JlL1NoYWRlclByb2dyYW0nKTtcbmV4cG9ydHMuVGlja2VyID0gcmVxdWlyZSgnLi9jb3JlL1RpY2tlcicpO1xuZXhwb3J0cy5UcmFuc2Zvcm0gPSByZXF1aXJlKCcuL2NvcmUvVHJhbnNmb3JtJyk7XG5leHBvcnRzLlZlY3RvcjJEID0gcmVxdWlyZSgnLi9jb3JlL21hdGgvVmVjdG9yMkQnKTtcbmV4cG9ydHMuVmVjdG9yM0QgPSByZXF1aXJlKCcuL2NvcmUvbWF0aC9WZWN0b3IzRCcpO1xuZXhwb3J0cy5jb25zdGFudHMgPSByZXF1aXJlKCcuL2NvcmUvY29uc3RhbnRzJyk7XG5leHBvcnRzLmNyZWF0ZVJlbmRlcmVyID0gcmVxdWlyZSgnLi9jb3JlL3JlbmRlcmVyJyk7XG5leHBvcnRzLnNoYWRlcnMgPSByZXF1aXJlKCcuL2NvcmUvc2hhZGVycycpO1xuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIHNlbGYudjYgPSBleHBvcnRzO1xufSIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0IGltcGxlbWVudGF0aW9uIG9mIE5vZGUuanMgRXZlbnRFbWl0dGVyLlxuICogQGNvbnN0cnVjdG9yIExpZ2h0RW1pdHRlclxuICogQGV4YW1wbGVcbiAqIHZhciBMaWdodEVtaXR0ZXIgPSByZXF1aXJlKCAnbGlnaHRfZW1pdHRlcicgKTtcbiAqL1xuZnVuY3Rpb24gTGlnaHRFbWl0dGVyICgpIHt9XG5cbkxpZ2h0RW1pdHRlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNlbWl0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7Li4uYW55fSBbZGF0YV1cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW1pdDogZnVuY3Rpb24gZW1pdCAoIHR5cGUgKSB7XG4gICAgdmFyIGxpc3QgPSBfZ2V0TGlzdCggdGhpcywgdHlwZSApO1xuICAgIHZhciBkYXRhLCBpLCBsO1xuXG4gICAgaWYgKCAhIGxpc3QgKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgICAgZGF0YSA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgIH1cblxuICAgIGZvciAoIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsOyArK2kgKSB7XG4gICAgICBpZiAoICEgbGlzdFsgaSBdLmFjdGl2ZSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICggbGlzdFsgaSBdLm9uY2UgKSB7XG4gICAgICAgIGxpc3RbIGkgXS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBkYXRhICkge1xuICAgICAgICBsaXN0WyBpIF0ubGlzdGVuZXIuYXBwbHkoIHRoaXMsIGRhdGEgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RbIGkgXS5saXN0ZW5lci5jYWxsKCB0aGlzICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgTGlnaHRFbWl0dGVyI29mZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbdHlwZV1cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvZmY6IGZ1bmN0aW9uIG9mZiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIHZhciBsaXN0LCBpO1xuXG4gICAgaWYgKCAhIHR5cGUgKSB7XG4gICAgICB0aGlzLl9ldmVudHMgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAoICggbGlzdCA9IF9nZXRMaXN0KCB0aGlzLCB0eXBlICkgKSApIHtcbiAgICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICAgIGZvciAoIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pICkge1xuICAgICAgICAgIGlmICggbGlzdFsgaSBdLmxpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBsaXN0WyBpIF0uYWN0aXZlICkge1xuICAgICAgICAgICAgbGlzdFsgaSBdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIExpZ2h0RW1pdHRlciNvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uOiBmdW5jdGlvbiBvbiAoIHR5cGUsIGxpc3RlbmVyICkge1xuICAgIF9vbiggdGhpcywgdHlwZSwgbGlzdGVuZXIgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBMaWdodEVtaXR0ZXIjb25jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uY2U6IGZ1bmN0aW9uIG9uY2UgKCB0eXBlLCBsaXN0ZW5lciApIHtcbiAgICBfb24oIHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IExpZ2h0RW1pdHRlclxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfb25cbiAqIEBwYXJhbSAge0xpZ2h0RW1pdHRlcn0gc2VsZlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICB0eXBlXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gICAgIGxpc3RlbmVyXG4gKiBAcGFyYW0gIHtib29sZWFufSAgICAgIG9uY2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9vbiAoIHNlbGYsIHR5cGUsIGxpc3RlbmVyLCBvbmNlICkge1xuICB2YXIgZW50aXR5ID0ge1xuICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICBhY3RpdmU6ICAgdHJ1ZSxcbiAgICB0eXBlOiAgICAgdHlwZSxcbiAgICBvbmNlOiAgICAgb25jZVxuICB9O1xuXG4gIGlmICggISBzZWxmLl9ldmVudHMgKSB7XG4gICAgc2VsZi5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZSggbnVsbCApO1xuICB9XG5cbiAgaWYgKCAhIHNlbGYuX2V2ZW50c1sgdHlwZSBdICkge1xuICAgIHNlbGYuX2V2ZW50c1sgdHlwZSBdID0gW107XG4gIH1cblxuICBzZWxmLl9ldmVudHNbIHR5cGUgXS5wdXNoKCBlbnRpdHkgKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQG1ldGhvZCBfZ2V0TGlzdFxuICogQHBhcmFtICB7TGlnaHRFbWl0dGVyfSAgIHNlbGZcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICB0eXBlXG4gKiBAcmV0dXJuIHthcnJheTxvYmplY3Q+P31cbiAqL1xuZnVuY3Rpb24gX2dldExpc3QgKCBzZWxmLCB0eXBlICkge1xuICByZXR1cm4gc2VsZi5fZXZlbnRzICYmIHNlbGYuX2V2ZW50c1sgdHlwZSBdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpZ2h0RW1pdHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90aHJvd0FyZ3VtZW50RXhjZXB0aW9uKHVuZXhwZWN0ZWQsIGV4cGVjdGVkKSB7XG4gICAgdGhyb3cgRXJyb3IoJ1wiJyArIHRvU3RyaW5nLmNhbGwodW5leHBlY3RlZCkgKyAnXCIgaXMgbm90ICcgKyBleHBlY3RlZCk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciB0eXBlID0gcmVxdWlyZSgnLi90eXBlJyk7XG52YXIgbGFzdFJlcyA9ICd1bmRlZmluZWQnO1xudmFyIGxhc3RWYWw7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90eXBlKHZhbCkge1xuICAgIGlmICh2YWwgPT09IGxhc3RWYWwpIHtcbiAgICAgICAgcmV0dXJuIGxhc3RSZXM7XG4gICAgfVxuICAgIHJldHVybiBsYXN0UmVzID0gdHlwZShsYXN0VmFsID0gdmFsKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfdW5lc2NhcGUoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9cXFxcKFxcXFwpPy9nLCAnJDEnKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGlzc2V0ID0gcmVxdWlyZSgnLi4vaXNzZXQnKTtcbnZhciB1bmRlZmluZWQ7XG52YXIgZGVmaW5lR2V0dGVyID0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fLCBkZWZpbmVTZXR0ZXIgPSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lU2V0dGVyX187XG5mdW5jdGlvbiBiYXNlRGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIGRlc2NyaXB0b3IpIHtcbiAgICB2YXIgaGFzR2V0dGVyID0gaXNzZXQoJ2dldCcsIGRlc2NyaXB0b3IpLCBoYXNTZXR0ZXIgPSBpc3NldCgnc2V0JywgZGVzY3JpcHRvciksIGdldCwgc2V0O1xuICAgIGlmIChoYXNHZXR0ZXIgfHwgaGFzU2V0dGVyKSB7XG4gICAgICAgIGlmIChoYXNHZXR0ZXIgJiYgdHlwZW9mIChnZXQgPSBkZXNjcmlwdG9yLmdldCkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignR2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbjogJyArIGdldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhc1NldHRlciAmJiB0eXBlb2YgKHNldCA9IGRlc2NyaXB0b3Iuc2V0KSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdTZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uOiAnICsgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNzZXQoJ3dyaXRhYmxlJywgZGVzY3JpcHRvcikpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBwcm9wZXJ0eSBkZXNjcmlwdG9yLiBDYW5ub3QgYm90aCBzcGVjaWZ5IGFjY2Vzc29ycyBhbmQgYSB2YWx1ZSBvciB3cml0YWJsZSBhdHRyaWJ1dGUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmaW5lR2V0dGVyKSB7XG4gICAgICAgICAgICBpZiAoaGFzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lR2V0dGVyLmNhbGwob2JqZWN0LCBrZXksIGdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaGFzU2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lU2V0dGVyLmNhbGwob2JqZWN0LCBrZXksIHNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ2Fubm90IGRlZmluZSBnZXR0ZXIgb3Igc2V0dGVyJyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzc2V0KCd2YWx1ZScsIGRlc2NyaXB0b3IpKSB7XG4gICAgICAgIG9iamVjdFtrZXldID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICB9IGVsc2UgaWYgKCFpc3NldChrZXksIG9iamVjdCkpIHtcbiAgICAgICAgb2JqZWN0W2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VEZWZpbmVQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VFeGVjKHJlZ2V4cCwgc3RyaW5nKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdLCB2YWx1ZTtcbiAgICByZWdleHAubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAodmFsdWUgPSByZWdleHAuZXhlYyhzdHJpbmcpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNhbGxJdGVyYXRlZSA9IHJlcXVpcmUoJy4uL2NhbGwtaXRlcmF0ZWUnKSwgaXNzZXQgPSByZXF1aXJlKCcuLi9pc3NldCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlRm9yRWFjaChhcnIsIGZuLCBjdHgsIGZyb21SaWdodCkge1xuICAgIHZhciBpLCBqLCBpZHg7XG4gICAgZm9yIChpID0gLTEsIGogPSBhcnIubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgaWYgKGZyb21SaWdodCkge1xuICAgICAgICAgICAgaWR4ID0gajtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlkeCA9ICsraTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNzZXQoaWR4LCBhcnIpICYmIGNhbGxJdGVyYXRlZShmbiwgY3R4LCBhcnJbaWR4XSwgaWR4LCBhcnIpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycjtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNhbGxJdGVyYXRlZSA9IHJlcXVpcmUoJy4uL2NhbGwtaXRlcmF0ZWUnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUZvckluKG9iaiwgZm4sIGN0eCwgZnJvbVJpZ2h0LCBrZXlzKSB7XG4gICAgdmFyIGksIGosIGtleTtcbiAgICBmb3IgKGkgPSAtMSwgaiA9IGtleXMubGVuZ3RoIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgaWYgKGZyb21SaWdodCkge1xuICAgICAgICAgICAga2V5ID0ga2V5c1tqXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleSA9IGtleXNbKytpXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbEl0ZXJhdGVlKGZuLCBjdHgsIG9ialtrZXldLCBrZXksIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgaXNzZXQgPSByZXF1aXJlKCcuLi9pc3NldCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXNlR2V0KG9iaiwgcGF0aCwgb2ZmKSB7XG4gICAgdmFyIGwgPSBwYXRoLmxlbmd0aCAtIG9mZiwgaSA9IDAsIGtleTtcbiAgICBmb3IgKDsgaSA8IGw7ICsraSkge1xuICAgICAgICBrZXkgPSBwYXRoW2ldO1xuICAgICAgICBpZiAoaXNzZXQoa2V5LCBvYmopKSB7XG4gICAgICAgICAgICBvYmogPSBvYmpba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgYmFzZVRvSW5kZXggPSByZXF1aXJlKCcuL2Jhc2UtdG8taW5kZXgnKTtcbnZhciBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YsIGxhc3RJbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mO1xuZnVuY3Rpb24gYmFzZUluZGV4T2YoYXJyLCBzZWFyY2gsIGZyb21JbmRleCwgZnJvbVJpZ2h0KSB7XG4gICAgdmFyIGwsIGksIGosIGlkeCwgdmFsO1xuICAgIGlmIChzZWFyY2ggPT09IHNlYXJjaCAmJiAoaWR4ID0gZnJvbVJpZ2h0ID8gbGFzdEluZGV4T2YgOiBpbmRleE9mKSkge1xuICAgICAgICByZXR1cm4gaWR4LmNhbGwoYXJyLCBzZWFyY2gsIGZyb21JbmRleCk7XG4gICAgfVxuICAgIGwgPSBhcnIubGVuZ3RoO1xuICAgIGlmICghbCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGogPSBsIC0gMTtcbiAgICBpZiAodHlwZW9mIGZyb21JbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZnJvbUluZGV4ID0gYmFzZVRvSW5kZXgoZnJvbUluZGV4LCBsKTtcbiAgICAgICAgaWYgKGZyb21SaWdodCkge1xuICAgICAgICAgICAgaiA9IE1hdGgubWluKGosIGZyb21JbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBqID0gTWF0aC5tYXgoMCwgZnJvbUluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBpID0gaiAtIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IC0xO1xuICAgIH1cbiAgICBmb3IgKDsgaiA+PSAwOyAtLWopIHtcbiAgICAgICAgaWYgKGZyb21SaWdodCkge1xuICAgICAgICAgICAgaWR4ID0gajtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlkeCA9ICsraTtcbiAgICAgICAgfVxuICAgICAgICB2YWwgPSBhcnJbaWR4XTtcbiAgICAgICAgaWYgKHZhbCA9PT0gc2VhcmNoIHx8IHNlYXJjaCAhPT0gc2VhcmNoICYmIHZhbCAhPT0gdmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gaWR4O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbm1vZHVsZS5leHBvcnRzID0gYmFzZUluZGV4T2Y7IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGJhc2VJbmRleE9mID0gcmVxdWlyZSgnLi9iYXNlLWluZGV4LW9mJyk7XG52YXIgc3VwcG9ydCA9IHJlcXVpcmUoJy4uL3N1cHBvcnQvc3VwcG9ydC1rZXlzJyk7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGssIGZpeEtleXM7XG5pZiAoc3VwcG9ydCA9PT0gJ25vdC1zdXBwb3J0ZWQnKSB7XG4gICAgayA9IFtcbiAgICAgICAgJ3RvU3RyaW5nJyxcbiAgICAgICAgJ3RvTG9jYWxlU3RyaW5nJyxcbiAgICAgICAgJ3ZhbHVlT2YnLFxuICAgICAgICAnaGFzT3duUHJvcGVydHknLFxuICAgICAgICAnaXNQcm90b3R5cGVPZicsXG4gICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgICAgICdjb25zdHJ1Y3RvcidcbiAgICBdO1xuICAgIGZpeEtleXMgPSBmdW5jdGlvbiBmaXhLZXlzKGtleXMsIG9iamVjdCkge1xuICAgICAgICB2YXIgaSwga2V5O1xuICAgICAgICBmb3IgKGkgPSBrLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAoYmFzZUluZGV4T2Yoa2V5cywga2V5ID0ga1tpXSkgPCAwICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfTtcbn1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmFzZUtleXMob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICB2YXIga2V5O1xuICAgIGZvciAoa2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzdXBwb3J0ICE9PSAnbm90LXN1cHBvcnRlZCcpIHtcbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfVxuICAgIHJldHVybiBmaXhLZXlzKGtleXMsIG9iamVjdCk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBnZXQgPSByZXF1aXJlKCcuL2Jhc2UtZ2V0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShvYmplY3QsIHBhdGgpIHtcbiAgICBpZiAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldChvYmplY3QsIHBhdGgsIDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmplY3RbcGF0aFswXV07XG4gICAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhc2VUb0luZGV4KHYsIGwpIHtcbiAgICBpZiAoIWwgfHwgIXYpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh2IDwgMCkge1xuICAgICAgICB2ICs9IGw7XG4gICAgfVxuICAgIHJldHVybiB2IHx8IDA7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vX3Rocm93LWFyZ3VtZW50LWV4Y2VwdGlvbicpO1xudmFyIGRlZmF1bHRUbyA9IHJlcXVpcmUoJy4vZGVmYXVsdC10bycpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiZWZvcmUobiwgZm4pIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBfdGhyb3dBcmd1bWVudEV4Y2VwdGlvbihmbiwgJ2EgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgbiA9IGRlZmF1bHRUbyhuLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoLS1uID49IDApIHtcbiAgICAgICAgICAgIHZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsSXRlcmF0ZWUoZm4sIGN0eCwgdmFsLCBrZXksIG9iaikge1xuICAgIGlmICh0eXBlb2YgY3R4ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZm4odmFsLCBrZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBmbi5jYWxsKGN0eCwgdmFsLCBrZXksIG9iaik7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBiYXNlRXhlYyA9IHJlcXVpcmUoJy4vYmFzZS9iYXNlLWV4ZWMnKSwgX3VuZXNjYXBlID0gcmVxdWlyZSgnLi9fdW5lc2NhcGUnKSwgaXNLZXkgPSByZXF1aXJlKCcuL2lzLWtleScpLCB0b0tleSA9IHJlcXVpcmUoJy4vdG8ta2V5JyksIF90eXBlID0gcmVxdWlyZSgnLi9fdHlwZScpO1xudmFyIHJQcm9wZXJ0eSA9IC8oXnxcXC4pXFxzKihbX2Etel1cXHcqKVxccyp8XFxbXFxzKigoPzotKT8oPzpcXGQrfFxcZCpcXC5cXGQrKXwoXCJ8JykoKFteXFxcXF1cXFxcKFxcXFxcXFxcKSp8W15cXDRdKSopXFw0KVxccypcXF0vZ2k7XG5mdW5jdGlvbiBzdHJpbmdUb1BhdGgoc3RyKSB7XG4gICAgdmFyIHBhdGggPSBiYXNlRXhlYyhyUHJvcGVydHksIHN0ciksIGkgPSBwYXRoLmxlbmd0aCAtIDEsIHZhbDtcbiAgICBmb3IgKDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFsID0gcGF0aFtpXTtcbiAgICAgICAgaWYgKHZhbFsyXSkge1xuICAgICAgICAgICAgcGF0aFtpXSA9IHZhbFsyXTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWxbNV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgcGF0aFtpXSA9IF91bmVzY2FwZSh2YWxbNV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGF0aFtpXSA9IHZhbFszXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbn1cbmZ1bmN0aW9uIGNhc3RQYXRoKHZhbCkge1xuICAgIHZhciBwYXRoLCBsLCBpO1xuICAgIGlmIChpc0tleSh2YWwpKSB7XG4gICAgICAgIHJldHVybiBbdG9LZXkodmFsKV07XG4gICAgfVxuICAgIGlmIChfdHlwZSh2YWwpID09PSAnYXJyYXknKSB7XG4gICAgICAgIHBhdGggPSBBcnJheShsID0gdmFsLmxlbmd0aCk7XG4gICAgICAgIGZvciAoaSA9IGwgLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgcGF0aFtpXSA9IHRvS2V5KHZhbFtpXSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRoID0gc3RyaW5nVG9QYXRoKCcnICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGNhc3RQYXRoOyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xhbXAodmFsdWUsIGxvd2VyLCB1cHBlcikge1xuICAgIGlmICh2YWx1ZSA+PSB1cHBlcikge1xuICAgICAgICByZXR1cm4gdXBwZXI7XG4gICAgfVxuICAgIGlmICh2YWx1ZSA8PSBsb3dlcikge1xuICAgICAgICByZXR1cm4gbG93ZXI7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vY3JlYXRlJyksIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnLi9nZXQtcHJvdG90eXBlLW9mJyksIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90by1vYmplY3QnKSwgZWFjaCA9IHJlcXVpcmUoJy4vZWFjaCcpLCBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzLW9iamVjdC1saWtlJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsb25lKGRlZXAsIHRhcmdldCwgZ3VhcmQpIHtcbiAgICB2YXIgY2xuO1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAndW5kZWZpbmVkJyB8fCBndWFyZCkge1xuICAgICAgICB0YXJnZXQgPSBkZWVwO1xuICAgICAgICBkZWVwID0gdHJ1ZTtcbiAgICB9XG4gICAgY2xuID0gY3JlYXRlKGdldFByb3RvdHlwZU9mKHRhcmdldCA9IHRvT2JqZWN0KHRhcmdldCkpKTtcbiAgICBlYWNoKHRhcmdldCwgZnVuY3Rpb24gKHZhbHVlLCBrZXksIHRhcmdldCkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgdGhpc1trZXldID0gdGhpcztcbiAgICAgICAgfSBlbHNlIGlmIChkZWVwICYmIGlzT2JqZWN0TGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IGNsb25lKGRlZXAsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSwgY2xuKTtcbiAgICByZXR1cm4gY2xuO1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUlI6IHtcbiAgICAgICAgSU5WQUxJRF9BUkdTOiAnSW52YWxpZCBhcmd1bWVudHMnLFxuICAgICAgICBGVU5DVElPTl9FWFBFQ1RFRDogJ0V4cGVjdGVkIGEgZnVuY3Rpb24nLFxuICAgICAgICBTVFJJTkdfRVhQRUNURUQ6ICdFeHBlY3RlZCBhIHN0cmluZycsXG4gICAgICAgIFVOREVGSU5FRF9PUl9OVUxMOiAnQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0JyxcbiAgICAgICAgUkVEVUNFX09GX0VNUFRZX0FSUkFZOiAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScsXG4gICAgICAgIE5PX1BBVEg6ICdObyBwYXRoIHdhcyBnaXZlbidcbiAgICB9LFxuICAgIE1BWF9BUlJBWV9MRU5HVEg6IDQyOTQ5NjcyOTUsXG4gICAgTUFYX1NBRkVfSU5UOiA5MDA3MTk5MjU0NzQwOTkxLFxuICAgIE1JTl9TQUZFX0lOVDogLTkwMDcxOTkyNTQ3NDA5OTEsXG4gICAgREVFUDogMSxcbiAgICBERUVQX0tFRVBfRk46IDIsXG4gICAgUExBQ0VIT0xERVI6IHt9XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBkZWZpbmVQcm9wZXJ0aWVzID0gcmVxdWlyZSgnLi9kZWZpbmUtcHJvcGVydGllcycpO1xudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnLi9zZXQtcHJvdG90eXBlLW9mJyk7XG52YXIgaXNQcmltaXRpdmUgPSByZXF1aXJlKCcuL2lzLXByaW1pdGl2ZScpO1xuZnVuY3Rpb24gQygpIHtcbn1cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBjcmVhdGUocHJvdG90eXBlLCBkZXNjcmlwdG9ycykge1xuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSAhPT0gbnVsbCAmJiBpc1ByaW1pdGl2ZShwcm90b3R5cGUpKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignT2JqZWN0IHByb3RvdHlwZSBtYXkgb25seSBiZSBhbiBPYmplY3Qgb3IgbnVsbDogJyArIHByb3RvdHlwZSk7XG4gICAgfVxuICAgIEMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIG9iamVjdCA9IG5ldyBDKCk7XG4gICAgQy5wcm90b3R5cGUgPSBudWxsO1xuICAgIGlmIChwcm90b3R5cGUgPT09IG51bGwpIHtcbiAgICAgICAgc2V0UHJvdG90eXBlT2Yob2JqZWN0LCBudWxsKTtcbiAgICB9XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMikge1xuICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgZGVzY3JpcHRvcnMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgYmFzZUZvckVhY2ggPSByZXF1aXJlKCcuLi9iYXNlL2Jhc2UtZm9yLWVhY2gnKSwgYmFzZUZvckluID0gcmVxdWlyZSgnLi4vYmFzZS9iYXNlLWZvci1pbicpLCBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2lzLWFycmF5LWxpa2UnKSwgdG9PYmplY3QgPSByZXF1aXJlKCcuLi90by1vYmplY3QnKSwgaXRlcmF0ZWUgPSByZXF1aXJlKCcuLi9pdGVyYXRlZScpLml0ZXJhdGVlLCBrZXlzID0gcmVxdWlyZSgnLi4va2V5cycpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVFYWNoKGZyb21SaWdodCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBlYWNoKG9iaiwgZm4sIGN0eCkge1xuICAgICAgICBvYmogPSB0b09iamVjdChvYmopO1xuICAgICAgICBmbiA9IGl0ZXJhdGVlKGZuKTtcbiAgICAgICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcbiAgICAgICAgICAgIHJldHVybiBiYXNlRm9yRWFjaChvYmosIGZuLCBjdHgsIGZyb21SaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2VGb3JJbihvYmosIGZuLCBjdHgsIGZyb21SaWdodCwga2V5cyhvYmopKTtcbiAgICB9O1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUdldEVsZW1lbnREaW1lbnNpb24obmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgdiwgYiwgZDtcbiAgICAgICAgaWYgKGUud2luZG93ID09PSBlKSB7XG4gICAgICAgICAgICB2ID0gTWF0aC5tYXgoZVsnaW5uZXInICsgbmFtZV0gfHwgMCwgZS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbJ2NsaWVudCcgKyBuYW1lXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5ub2RlVHlwZSA9PT0gOSkge1xuICAgICAgICAgICAgYiA9IGUuYm9keTtcbiAgICAgICAgICAgIGQgPSBlLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgICAgIHYgPSBNYXRoLm1heChiWydzY3JvbGwnICsgbmFtZV0sIGRbJ3Njcm9sbCcgKyBuYW1lXSwgYlsnb2Zmc2V0JyArIG5hbWVdLCBkWydvZmZzZXQnICsgbmFtZV0sIGJbJ2NsaWVudCcgKyBuYW1lXSwgZFsnY2xpZW50JyArIG5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHYgPSBlWydjbGllbnQnICsgbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNhc3RQYXRoID0gcmVxdWlyZSgnLi4vY2FzdC1wYXRoJyksIG5vb3AgPSByZXF1aXJlKCcuLi9ub29wJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5KGJhc2VQcm9wZXJ0eSwgdXNlQXJncykge1xuICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgaWYgKCEocGF0aCA9IGNhc3RQYXRoKHBhdGgpKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBub29wO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VBcmdzKSB7XG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGJhc2VQcm9wZXJ0eShvYmplY3QsIHBhdGgsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH07XG59OyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmYXVsdFRvKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgbWl4aW4gPSByZXF1aXJlKCcuL21peGluJyksIGNsb25lID0gcmVxdWlyZSgnLi9jbG9uZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZhdWx0cyhkZWZhdWx0cywgb2JqZWN0KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBjbG9uZSh0cnVlLCBkZWZhdWx0cyk7XG4gICAgfVxuICAgIHJldHVybiBtaXhpbih0cnVlLCBjbG9uZSh0cnVlLCBkZWZhdWx0cyksIG9iamVjdCk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBzdXBwb3J0ID0gcmVxdWlyZSgnLi9zdXBwb3J0L3N1cHBvcnQtZGVmaW5lLXByb3BlcnR5Jyk7XG52YXIgZGVmaW5lUHJvcGVydGllcywgYmFzZURlZmluZVByb3BlcnR5LCBpc1ByaW1pdGl2ZSwgZWFjaDtcbmlmIChzdXBwb3J0ICE9PSAnZnVsbCcpIHtcbiAgICBpc1ByaW1pdGl2ZSA9IHJlcXVpcmUoJy4vaXMtcHJpbWl0aXZlJyk7XG4gICAgZWFjaCA9IHJlcXVpcmUoJy4vZWFjaCcpO1xuICAgIGJhc2VEZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vYmFzZS9iYXNlLWRlZmluZS1wcm9wZXJ0eScpO1xuICAgIGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgZGVzY3JpcHRvcnMpIHtcbiAgICAgICAgaWYgKHN1cHBvcnQgIT09ICdub3Qtc3VwcG9ydGVkJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBkZXNjcmlwdG9ycyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHJpbWl0aXZlKG9iamVjdCkpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignZGVmaW5lUHJvcGVydGllcyBjYWxsZWQgb24gbm9uLW9iamVjdCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZShkZXNjcmlwdG9ycykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignUHJvcGVydHkgZGVzY3JpcHRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICcgKyBkZXNjcmlwdG9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgZWFjaChkZXNjcmlwdG9ycywgZnVuY3Rpb24gKGRlc2NyaXB0b3IsIGtleSkge1xuICAgICAgICAgICAgaWYgKGlzUHJpbWl0aXZlKGRlc2NyaXB0b3IpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdQcm9wZXJ0eSBkZXNjcmlwdGlvbiBtdXN0IGJlIGFuIG9iamVjdDogJyArIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFzZURlZmluZVByb3BlcnR5KHRoaXMsIGtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH0sIG9iamVjdCk7XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzO1xufVxubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVQcm9wZXJ0aWVzOyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUvY3JlYXRlLWVhY2gnKSgpOyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUvY3JlYXRlLWdldC1lbGVtZW50LWRpbWVuc2lvbicpKCdIZWlnaHQnKTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlL2NyZWF0ZS1nZXQtZWxlbWVudC1kaW1lbnNpb24nKSgnV2lkdGgnKTsiLCIndXNlIHN0cmljdCc7XG52YXIgRVJSID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKS5FUlI7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gZ2V0UHJvdG90eXBlT2Yob2JqKSB7XG4gICAgdmFyIHByb3RvdHlwZTtcbiAgICBpZiAob2JqID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKEVSUi5VTkRFRklORURfT1JfTlVMTCk7XG4gICAgfVxuICAgIHByb3RvdHlwZSA9IG9iai5fX3Byb3RvX187XG4gICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBwcm90b3R5cGU7XG4gICAgfVxuICAgIGlmICh0b1N0cmluZy5jYWxsKG9iai5jb25zdHJ1Y3RvcikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHtcbiAgICAgICAgcmV0dXJuIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzLW9iamVjdC1saWtlJyksIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pcy1sZW5ndGgnKSwgaXNXaW5kb3dMaWtlID0gcmVxdWlyZSgnLi9pcy13aW5kb3ctbGlrZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgIWlzV2luZG93TGlrZSh2YWx1ZSk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXMtbGVuZ3RoJyksIGlzV2luZG93TGlrZSA9IHJlcXVpcmUoJy4vaXMtd2luZG93LWxpa2UnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICFpc1dpbmRvd0xpa2UodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXMtb2JqZWN0LWxpa2UnKSwgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzLWxlbmd0aCcpO1xudmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSh2YWx1ZSkge1xuICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBfdHlwZSA9IHJlcXVpcmUoJy4vX3R5cGUnKTtcbnZhciByRGVlcEtleSA9IC8oXnxbXlxcXFxdKShcXFxcXFxcXCkqKFxcLnxcXFspLztcbmZ1bmN0aW9uIGlzS2V5KHZhbCkge1xuICAgIHZhciB0eXBlO1xuICAgIGlmICghdmFsKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoX3R5cGUodmFsKSA9PT0gJ2FycmF5Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbicgfHwgX3R5cGUodmFsKSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiAhckRlZXBLZXkudGVzdCh2YWwpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBpc0tleTsiLCIndXNlIHN0cmljdCc7XG52YXIgTUFYX0FSUkFZX0xFTkdUSCA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJykuTUFYX0FSUkFZX0xFTkdUSDtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IE1BWF9BUlJBWV9MRU5HVEggJiYgdmFsdWUgJSAxID09PSAwO1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzLW9iamVjdC1saWtlJyk7XG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoJy4vZ2V0LXByb3RvdHlwZS1vZicpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1vYmplY3QnKTtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgT0JKRUNUID0gdG9TdHJpbmcuY2FsbChPYmplY3QpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KHYpIHtcbiAgICB2YXIgcCwgYztcbiAgICBpZiAoIWlzT2JqZWN0KHYpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcCA9IGdldFByb3RvdHlwZU9mKHYpO1xuICAgIGlmIChwID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIWhhc093blByb3BlcnR5LmNhbGwocCwgJ2NvbnN0cnVjdG9yJykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjID0gcC5jb25zdHJ1Y3RvcjtcbiAgICByZXR1cm4gdHlwZW9mIGMgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbChjKSA9PT0gT0JKRUNUO1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbHVlKSB7XG4gICAgcmV0dXJuICF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJztcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIHR5cGUgPSByZXF1aXJlKCcuL3R5cGUnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZSh2YWx1ZSkgPT09ICdzeW1ib2wnO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pcy1vYmplY3QtbGlrZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1dpbmRvd0xpa2UodmFsdWUpIHtcbiAgICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB2YWx1ZS53aW5kb3cgPT09IHZhbHVlO1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzc2V0KGtleSwgb2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiBvYmpba2V5XSAhPT0gJ3VuZGVmaW5lZCcgfHwga2V5IGluIG9iajtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGlzQXJyYXlMaWtlT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1hcnJheS1saWtlLW9iamVjdCcpLCBtYXRjaGVzUHJvcGVydHkgPSByZXF1aXJlKCcuL21hdGNoZXMtcHJvcGVydHknKSwgcHJvcGVydHkgPSByZXF1aXJlKCcuL3Byb3BlcnR5Jyk7XG5leHBvcnRzLml0ZXJhdGVlID0gZnVuY3Rpb24gaXRlcmF0ZWUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlc1Byb3BlcnR5KHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3BlcnR5KHZhbHVlKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGJhc2VLZXlzID0gcmVxdWlyZSgnLi9iYXNlL2Jhc2Uta2V5cycpO1xudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90by1vYmplY3QnKTtcbnZhciBzdXBwb3J0ID0gcmVxdWlyZSgnLi9zdXBwb3J0L3N1cHBvcnQta2V5cycpO1xuaWYgKHN1cHBvcnQgIT09ICdlczIwMTUnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBrZXlzKHYpIHtcbiAgICAgICAgdmFyIF9rZXlzO1xuICAgICAgICBpZiAoc3VwcG9ydCA9PT0gJ2VzNScpIHtcbiAgICAgICAgICAgIF9rZXlzID0gT2JqZWN0LmtleXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfa2V5cyA9IGJhc2VLZXlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfa2V5cyh0b09iamVjdCh2KSk7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cztcbn0iLCIndXNlIHN0cmljdCc7XG52YXIgY2FzdFBhdGggPSByZXF1aXJlKCcuL2Nhc3QtcGF0aCcpLCBnZXQgPSByZXF1aXJlKCcuL2Jhc2UvYmFzZS1nZXQnKSwgRVJSID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKS5FUlI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdGNoZXNQcm9wZXJ0eShwcm9wZXJ0eSkge1xuICAgIHZhciBwYXRoID0gY2FzdFBhdGgocHJvcGVydHlbMF0pLCB2YWx1ZSA9IHByb3BlcnR5WzFdO1xuICAgIGlmICghcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoRVJSLk5PX1BBVEgpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0KG9iamVjdCwgcGF0aCwgMCkgPT09IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmplY3RbcGF0aFswXV0gPT09IHZhbHVlO1xuICAgIH07XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBpc1BsYWluT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1wbGFpbi1vYmplY3QnKTtcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG8tb2JqZWN0Jyk7XG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXMtYXJyYXknKTtcbnZhciBrZXlzID0gcmVxdWlyZSgnLi9rZXlzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1peGluKGRlZXAsIG9iamVjdCkge1xuICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDI7XG4gICAgdmFyIG5hbWVzLCBleHAsIGosIGssIHZhbCwga2V5LCBub3dBcnJheSwgc3JjO1xuICAgIGlmICh0eXBlb2YgZGVlcCAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIG9iamVjdCA9IGRlZXA7XG4gICAgICAgIGRlZXAgPSB0cnVlO1xuICAgICAgICBpID0gMTtcbiAgICB9XG4gICAgaWYgKGkgPT09IGwpIHtcbiAgICAgICAgb2JqZWN0ID0gdGhpcztcbiAgICAgICAgLS1pO1xuICAgIH1cbiAgICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuICAgIGZvciAoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgIG5hbWVzID0ga2V5cyhleHAgPSB0b09iamVjdChhcmd1bWVudHNbaV0pKTtcbiAgICAgICAgZm9yIChqID0gMCwgayA9IG5hbWVzLmxlbmd0aDsgaiA8IGs7ICsraikge1xuICAgICAgICAgICAgdmFsID0gZXhwW2tleSA9IG5hbWVzW2pdXTtcbiAgICAgICAgICAgIGlmIChkZWVwICYmIHZhbCAhPT0gZXhwICYmIChpc1BsYWluT2JqZWN0KHZhbCkgfHwgKG5vd0FycmF5ID0gaXNBcnJheSh2YWwpKSkpIHtcbiAgICAgICAgICAgICAgICBzcmMgPSBvYmplY3Rba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAobm93QXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0FycmF5KHNyYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5vd0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXNQbGFpbk9iamVjdChzcmMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IG1peGluKHRydWUsIHNyYywgdmFsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0W2tleV0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbn07IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBub29wKCkge1xufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IERhdGUubm93IHx8IGZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBiZWZvcmUgPSByZXF1aXJlKCcuL2JlZm9yZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlKHRhcmdldCkge1xuICAgIHJldHVybiBiZWZvcmUoMSwgdGFyZ2V0KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NyZWF0ZS9jcmVhdGUtcHJvcGVydHknKShyZXF1aXJlKCcuL2Jhc2UvYmFzZS1wcm9wZXJ0eScpKTsiLCIndXNlIHN0cmljdCc7XG52YXIgaXNQcmltaXRpdmUgPSByZXF1aXJlKCcuL2lzLXByaW1pdGl2ZScpLCBFUlIgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpLkVSUjtcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIHNldFByb3RvdHlwZU9mKHRhcmdldCwgcHJvdG90eXBlKSB7XG4gICAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihFUlIuVU5ERUZJTkVEX09SX05VTEwpO1xuICAgIH1cbiAgICBpZiAocHJvdG90eXBlICE9PSBudWxsICYmIGlzUHJpbWl0aXZlKHByb3RvdHlwZSkpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdPYmplY3QgcHJvdG90eXBlIG1heSBvbmx5IGJlIGFuIE9iamVjdCBvciBudWxsOiAnICsgcHJvdG90eXBlKTtcbiAgICB9XG4gICAgaWYgKCdfX3Byb3RvX18nIGluIHRhcmdldCkge1xuICAgICAgICB0YXJnZXQuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgc3VwcG9ydDtcbmZ1bmN0aW9uIHRlc3QodGFyZ2V0KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKCcnIGluIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICcnLCB7fSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5pZiAodGVzdCh7fSkpIHtcbiAgICBzdXBwb3J0ID0gJ2Z1bGwnO1xufSBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRlc3QoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKSkge1xuICAgIHN1cHBvcnQgPSAnZG9tJztcbn0gZWxzZSB7XG4gICAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn1cbm1vZHVsZS5leHBvcnRzID0gc3VwcG9ydDsiLCIndXNlIHN0cmljdCc7XG52YXIgc3VwcG9ydDtcbmlmIChPYmplY3Qua2V5cykge1xuICAgIHRyeSB7XG4gICAgICAgIHN1cHBvcnQgPSBPYmplY3Qua2V5cygnJyksICdlczIwMTUnO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc3VwcG9ydCA9ICdlczUnO1xuICAgIH1cbn0gZWxzZSBpZiAoeyB0b1N0cmluZzogbnVsbCB9LnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpKSB7XG4gICAgc3VwcG9ydCA9ICdub3Qtc3VwcG9ydGVkJztcbn0gZWxzZSB7XG4gICAgc3VwcG9ydCA9ICdoYXMtYS1idWcnO1xufVxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0OyIsIid1c2Ugc3RyaWN0JztcbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCcuL3RpbWVzdGFtcCcpO1xudmFyIHJlcXVlc3RBRiwgY2FuY2VsQUY7XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYW5jZWxBRiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdENhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICByZXF1ZXN0QUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcbn1cbnZhciBub1JlcXVlc3RBbmltYXRpb25GcmFtZSA9ICFyZXF1ZXN0QUYgfHwgIWNhbmNlbEFGIHx8IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIC9pUChhZHxob25lfG9kKS4qT1NcXHM2Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuaWYgKG5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgdmFyIGxhc3RSZXF1ZXN0VGltZSA9IDAsIGZyYW1lRHVyYXRpb24gPSAxMDAwIC8gNjA7XG4gICAgZXhwb3J0cy5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChhbmltYXRlKSB7XG4gICAgICAgIHZhciBub3cgPSB0aW1lc3RhbXAoKSwgbmV4dFJlcXVlc3RUaW1lID0gTWF0aC5tYXgobGFzdFJlcXVlc3RUaW1lICsgZnJhbWVEdXJhdGlvbiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGFzdFJlcXVlc3RUaW1lID0gbmV4dFJlcXVlc3RUaW1lO1xuICAgICAgICAgICAgYW5pbWF0ZShub3cpO1xuICAgICAgICB9LCBuZXh0UmVxdWVzdFRpbWUgLSBub3cpO1xuICAgIH07XG4gICAgZXhwb3J0cy5jYW5jZWwgPSBjbGVhclRpbWVvdXQ7XG59IGVsc2Uge1xuICAgIGV4cG9ydHMucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QoYW5pbWF0ZSkge1xuICAgICAgICByZXR1cm4gcmVxdWVzdEFGKGFuaW1hdGUpO1xuICAgIH07XG4gICAgZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNhbmNlbEFGKGlkKTtcbiAgICB9O1xufSIsIid1c2Ugc3RyaWN0JztcbnZhciBub3cgPSByZXF1aXJlKCcuL25vdycpO1xudmFyIG5hdmlnYXRvclN0YXJ0O1xuaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gJ3VuZGVmaW5lZCcgfHwgIXBlcmZvcm1hbmNlLm5vdykge1xuICAgIG5hdmlnYXRvclN0YXJ0ID0gbm93KCk7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gICAgICAgIHJldHVybiBub3coKSAtIG5hdmlnYXRvclN0YXJ0O1xuICAgIH07XG59IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICAgICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfTtcbn0iLCIndXNlIHN0cmljdCc7XG52YXIgX3VuZXNjYXBlID0gcmVxdWlyZSgnLi9fdW5lc2NhcGUnKSwgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzLXN5bWJvbCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b0tleSh2YWwpIHtcbiAgICB2YXIga2V5O1xuICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gX3VuZXNjYXBlKHZhbCk7XG4gICAgfVxuICAgIGlmIChpc1N5bWJvbCh2YWwpKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGtleSA9ICcnICsgdmFsO1xuICAgIGlmIChrZXkgPT09ICcwJyAmJiAxIC8gdmFsID09PSAtSW5maW5pdHkpIHtcbiAgICAgICAgcmV0dXJuICctMCc7XG4gICAgfVxuICAgIHJldHVybiBfdW5lc2NhcGUoa2V5KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIEVSUiA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJykuRVJSO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b09iamVjdCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihFUlIuVU5ERUZJTkVEX09SX05VTEwpO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0KHZhbHVlKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vY3JlYXRlJyk7XG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZywgdHlwZXMgPSBjcmVhdGUobnVsbCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFR5cGUodmFsdWUpIHtcbiAgICB2YXIgdHlwZSwgdGFnO1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJ251bGwnO1xuICAgIH1cbiAgICB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICAgIGlmICh0eXBlICE9PSAnb2JqZWN0JyAmJiB0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgICB0eXBlID0gdHlwZXNbdGFnID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSldO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZXNbdGFnXSA9IHRhZy5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKTtcbn07Il19
