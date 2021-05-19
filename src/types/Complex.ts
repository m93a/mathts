/**
 * @license Complex.js
 *
 * Copyright (c) 2020, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

const cosh = function(x: number) {
    return (Math.exp(x) + Math.exp(-x)) * 0.5;
};

const sinh = function(x: number) {
    return (Math.exp(x) - Math.exp(-x)) * 0.5;
};

/**
 * Calculates cos(x) - 1 using Taylor series if x is small (-¼π ≤ x ≤ ¼π).
 *
 * @param {number} x
 * @returns {number} cos(x) - 1
 */
const cosm1 = function(x: number) {

    var b = Math.PI / 4;
    if (-b > x || x > b) {
    return Math.cos(x) - 1.0;
    }

    /* Calculate horner form of polynomial of taylor series in Q
    var fac = 1, alt = 1, pol = {};
    for (var i = 0; i <= 16; i++) {
    fac*= i || 1;
    if (i % 2 == 0) {
        pol[i] = new Fraction(1, alt * fac);
        alt = -alt;
    }
    }
    console.log(new Polynomial(pol).toHorner()); // (((((((1/20922789888000x^2-1/87178291200)x^2+1/479001600)x^2-1/3628800)x^2+1/40320)x^2-1/720)x^2+1/24)x^2-1/2)x^2+1
    */

    var xx = x * x;
    return xx * (
    xx * (
        xx * (
        xx * (
            xx * (
            xx * (
                xx * (
                xx / 20922789888000
                - 1 / 87178291200)
                + 1 / 479001600)
            - 1 / 3628800)
            + 1 / 40320)
        - 1 / 720)
        + 1 / 24)
    - 1 / 2);
};

const hypot = function(x: number, y: number) {

    var a = Math.abs(x);
    var b = Math.abs(y);

    if (a < 3000 && b < 3000) {
    return Math.sqrt(a * a + b * b);
    }

    if (a < b) {
    a = b;
    b = x / y;
    } else {
    b = y / x;
    }
    return a * Math.sqrt(1 + b * b);
};

var parser_exit = function() {
    throw SyntaxError('Invalid Param');
};

/**
 * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function logHypot(a: number, b: number) {

    var _a = Math.abs(a);
    var _b = Math.abs(b);

    if (a === 0) {
    return Math.log(_b);
    }

    if (b === 0) {
    return Math.log(_a);
    }

    if (_a < 3000 && _b < 3000) {
    return Math.log(a * a + b * b) * 0.5;
    }

    /* I got 4 ideas to compute this property without overflow:
    *
    * Testing 1000000 times with random samples for a,b ∈ [1, 1000000000] against a big decimal library to get an error estimate
    *
    * 1. Only eliminate the square root: (OVERALL ERROR: 3.9122483030951116e-11)

    Math.log(a * a + b * b) / 2

    *
    *
    * 2. Try to use the non-overflowing pythagoras: (OVERALL ERROR: 8.889760039210159e-10)

    var fn = function(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    var t = Math.min(a, b);
    a = Math.max(a, b);
    t = t / a;

    return Math.log(a) + Math.log(1 + t * t) / 2;
    };

    * 3. Abuse the identity cos(atan(y/x) = x / sqrt(x^2+y^2): (OVERALL ERROR: 3.4780178737037204e-10)

    Math.log(a / Math.cos(Math.atan2(b, a)))

    * 4. Use 3. and apply log rules: (OVERALL ERROR: 1.2014087502620896e-9)

    Math.log(a) - Math.log(Math.cos(Math.atan2(b, a)))

    */

    return Math.log(a / Math.cos(Math.atan2(b, a)));
}

function parse(z: { re: number, im: number }): { re: number, im: number }
function parse(z: { r: number, phi: number }): { re: number, im: number }
function parse(re: number, im: number): { re: number, im: number }
function parse(z: [number, number]): { re: number, im: number }
function parse(re: number): { re: number, im: number }
function parse(z: string): { re: number, im: number }
function parse(): { re: number, im: number }

function parse(a?: any, b?: any): { re: number, im: number } {

    var z = { 're': 0, 'im': 0 };

    if (a === undefined || a === null) {
        z.re =
        z.im = 0;
    } else if (b !== undefined) {
        z.re = a;
        z.im = b;
    } else
    switch (typeof a) {

        case 'object':

            if ('im' in a && 're' in a) {
                z.re = a.re;
                z.im = a.im;
            } else if ('abs' in a && 'arg' in a) {
                if (!Number.isFinite(a.abs) && Number.isFinite(a['arg'])) {
                    return Complex.INFINITY;
                }
                z.re = a.abs * Math.cos(a['arg']);
                z.im = a.abs * Math.sin(a['arg']);
            } else if ('r' in a && 'phi' in a) {
                if (!Number.isFinite(a['r']) && Number.isFinite(a['phi'])) {
                    return Complex.INFINITY;
                }
                z.re = a['r'] * Math.cos(a['phi']);
                z.im = a['r'] * Math.sin(a['phi']);
            } else if (a.length === 2) { // Quick array check
                z.re = a[0];
                z.im = a[1];
            } else {
                parser_exit();
            }
            break;

        case 'string':

            z.im = /* void */
            z.re = 0;

            let tokens = a.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
            let plus = 1;
            let minus = 0;

            if (tokens === null) {
                parser_exit();
            }

            for (var i = 0; i < tokens.length; i++) {

                var c = tokens[i];

                if (c === ' ' || c === '\t' || c === '\n') {
                    /* void */
                } else if (c === '+') {
                    plus++;
                } else if (c === '-') {
                    minus++;
                } else if (c === 'i' || c === 'I') {

                    if (plus + minus === 0) {
                        parser_exit();
                    }

                    if (tokens[i + 1] !== ' ' && !isNaN(+tokens[i + 1])) {
                        z.im += parseFloat((minus % 2 ? '-' : '') + tokens[i + 1]);
                        i++;
                    } else {
                        z.im += parseFloat((minus % 2 ? '-' : '') + '1');
                    }
                    plus = minus = 0;

                } else {

                    if (plus + minus === 0 || isNaN(+c)) {
                        parser_exit();
                    }

                    if (tokens[i + 1] === 'i' || tokens[i + 1] === 'I') {
                        z.im += parseFloat((minus % 2 ? '-' : '') + c);
                        i++;
                    } else {
                        z.re += parseFloat((minus % 2 ? '-' : '') + c);
                    }
                    plus = minus = 0;
                }
            }

            // Still something on the stack
            if (plus + minus > 0) {
                parser_exit();
            }
        break;

        case 'number':
            z.im = 0;
            z.re = a;
            break;

        default:
            parser_exit();
    }

    if (isNaN(z.re) || isNaN(z.im)) {
        // If a calculation is NaN, we treat it as NaN and don't throw
        //parser_exit();
    }

    return z;
};

export class Complex {
    constructor(z: { re: number, im: number })
    constructor(z: { r: number, phi: number })
    constructor(re: number, im: number)
    constructor(z: [number, number])
    constructor(re: number)
    constructor(z: string)
    constructor()

    constructor (a?: any, b?: any) {

        if (!(this instanceof Complex)) {
            return new Complex(a, b);
        }

        var z = parse(a, b);

        this.re = z.re;
        this.im = z.im;
    }

    re = 0
    im = 0

    static readonly ZERO = new Complex(0, 0);
    static readonly ONE = new Complex(1, 0);
    static readonly I = new Complex(0, 1);
    static readonly PI = new Complex(Math.PI, 0);
    static readonly E = new Complex(Math.E, 0);
    static readonly INFINITY = new Complex(Infinity, Infinity);
    static readonly NAN = new Complex(NaN, NaN);
    static readonly EPSILON = 1e-15;

    /**
     * Calculates the sign of a complex number, which is a normalized complex
     *
     * @returns {Complex}
     */
    sign() {
        const abs = this.abs();

        return new Complex(
            this.re / abs,
            this.im / abs);
    }

    /**
     * Adds two complex numbers
     *
     * @returns {Complex}
     */

    add(z: { re: number, im: number }): Complex
    add(z: { r: number, phi: number }): Complex
    add(re: number, im: number): Complex
    add(z: [number, number]): Complex
    add(re: number): Complex
    add(z: string): Complex

    add(a?: any, b?: any) {

        const z = new Complex(a, b);

        // Infinity + Infinity = NaN
        if (this.isInfinite() && z.isInfinite()) {
            return Complex.NAN;
        }

        // Infinity + z = Infinity { where z != Infinity }
        if (this.isInfinite() || z.isInfinite()) {
            return Complex.INFINITY;
        }

        return new Complex(
            this.re + z.re,
            this.im + z.im);
    }

    /**
     * Subtracts two complex numbers
     *
     * @returns {Complex}
     */

    sub(z: { re: number, im: number }): Complex
    sub(z: { r: number, phi: number }): Complex
    sub(re: number, im: number): Complex
    sub(z: [number, number]): Complex
    sub(re: number): Complex
    sub(z: string): Complex

    sub(a?: any, b?: any) {
        const z = new Complex(a, b);

        // Infinity - Infinity = NaN
        if (this.isInfinite() && z.isInfinite()) {
            return Complex.NAN;
        }

        // Infinity - z = Infinity { where z != Infinity }
        if (this.isInfinite() || z.isInfinite()) {
            return Complex.INFINITY;
        }

        return new Complex(
            this.re - z.re,
            this.im - z.im);
    }

    /**
     * Multiplies two complex numbers
     *
     * @returns {Complex}
     */

    mul(z: { re: number, im: number }): Complex
    mul(z: { r: number, phi: number }): Complex
    mul(re: number, im: number): Complex
    mul(z: [number, number]): Complex
    mul(re: number): Complex
    mul(z: string): Complex

    mul(a?: any, b?: any) {
        const z = new Complex(a, b);

        // Infinity * 0 = NaN
        if ((this.isInfinite() && z.isZero()) || (this.isZero() && z.isInfinite())) {
            return Complex.NAN;
        }

        // Infinity * z = Infinity { where z != 0 }
        if (this.isInfinite() || z.isInfinite()) {
            return Complex.INFINITY;
        }

        // Short circuit for real values
        if (z.im === 0 && this.im === 0) {
            return new Complex(this.re * z.re, 0);
        }

        return new Complex(
            this.re * z.re - this.im * z.im,
            this.re * z.im + this.im * z.re);
    }

    /**
     * Divides two complex numbers
     *
     * @returns {Complex}
     */

    div(z: { re: number, im: number }): Complex
    div(z: { r: number, phi: number }): Complex
    div(re: number, im: number): Complex
    div(z: [number, number]): Complex
    div(re: number): Complex
    div(z: string): Complex

    div(a?: any, b?: any) {

        const z = new Complex(a, b);

        // 0 / 0 = NaN and Infinity / Infinity = NaN
        if ((this.isZero() && z.isZero()) || (this.isInfinite() && z.isInfinite())) {
            return Complex.NAN;
        }

        // Infinity / 0 = Infinity
        if (this.isInfinite() || z.isZero()) {
            return Complex.INFINITY;
        }

        // 0 / Infinity = 0
        if (this.isZero() || z.isInfinite()) {
            return Complex.ZERO;
        }

        a = this.re;
        b = this.im;

        var c = z.re;
        var d = z.im;
        var t, x;

        if (0 === d) {
            // Divisor is real
            return new Complex(a / c, b / c);
        }

        if (Math.abs(c) < Math.abs(d)) {

            x = c / d;
            t = c * x + d;

            return new Complex(
                (a * x + b) / t,
                (b * x - a) / t);

        } else {

            x = d / c;
            t = d * x + c;

            return new Complex(
                (a + b * x) / t,
                (b - a * x) / t);
        }
    }

    /**
     * Calculate the power of two complex numbers
     *
     * @returns {Complex}
     */

    pow(z: { re: number, im: number }): Complex
    pow(z: { r: number, phi: number }): Complex
    pow(re: number, im: number): Complex
    pow(z: [number, number]): Complex
    pow(re: number): Complex
    pow(z: string): Complex

    pow(a?: any, b?: any) {

        const z = new Complex(a, b);

        let { re, im } = this;

        if (z.isZero()) {
            return Complex.ONE;
        }

        // If the exponent is real
        if (z.im === 0) {

            if (im === 0 && re > 0) {

                return new Complex(Math.pow(re, z.re), 0);

            } else if (re === 0) { // If base is fully imaginary

                switch ((z.re % 4 + 4) % 4) {
                    case 0:
                        return new Complex(Math.pow(im, z.re), 0);
                    case 1:
                        return new Complex(0, Math.pow(im, z.re));
                    case 2:
                        return new Complex(-Math.pow(im, z.re), 0);
                    case 3:
                        return new Complex(0, -Math.pow(im, z.re));
                }
            }
        }

        /* I couldn't find a good formula, so here is a derivation and optimization
            *
            * z_1^z_2 = (a + bi)^(c + di)
            *         = exp((c + di) * log(a + bi)
            *         = pow(a^2 + b^2, (c + di) / 2) * exp(i(c + di)atan2(b, a))
            * =>...
            * Re = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * cos(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
            * Im = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * sin(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
            *
            * =>...
            * Re = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * cos(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
            * Im = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * sin(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
            *
            * =>
            * Re = exp(c * logsq2 - d * arg(z_1)) * cos(d * logsq2 + c * arg(z_1))
            * Im = exp(c * logsq2 - d * arg(z_1)) * sin(d * logsq2 + c * arg(z_1))
            *
            */

        if (re === 0 && im === 0 && z.re > 0 && z.im >= 0) {
            return Complex.ZERO;
        }

        var arg = Math.atan2(im, re);
        var loh = logHypot(re, im);

        re = Math.exp(z.re * loh - z.im * arg);
        im = z.im * loh + z.re * arg;

        return new Complex(
            re * Math.cos(im),
            re * Math.sin(im));
    }

    /**
     * Calculate the complex square root
     *
     * @returns {Complex}
     */
    sqrt(): Complex {

        const { re, im } = this;
        const r = this.abs();

        let a: number, b: number;

        if (re >= 0) {

            if (im === 0) {
                return new Complex(Math.sqrt(re), 0);
            }

            a = 0.5 * Math.sqrt(2.0 * (r + re));
        } else {
            a = Math.abs(im) / Math.sqrt(2 * (r - re));
        }

        if (re <= 0) {
            b = 0.5 * Math.sqrt(2.0 * (r - re));
        } else {
            b = Math.abs(im) / Math.sqrt(2 * (r + re));
        }

        return new Complex(a, im < 0 ? -b : b);
    }

    /**
     * Calculate the complex exponent
     *
     * @returns {Complex}
     */
    exp() {

        const expRe = Math.exp(this.re);

        if (this.im === 0) {
            //return new Complex(tmp, 0);
        }
        return new Complex(
            expRe * Math.cos(this.im),
            expRe * Math.sin(this.im));
    }

    /**
     * Calculate the complex exponent and subtracts one.
     *
     * This may be more accurate than `Complex(x).exp().sub(1)` if
     * `x` is small.
     *
     * @returns {Complex}
     */
    expm1() {

        /**
         * exp(a + i*b) - 1
         = exp(a) * (cos(b) + j*sin(b)) - 1
            = expm1(a)*cos(b) + cosm1(b) + j*exp(a)*sin(b)
            */

        const { re, im } = this;

        return new Complex(
            Math.expm1(re) * Math.cos(im) + cosm1(im),
            Math.exp(re) * Math.sin(im));
    }

    /**
     * Calculate the natural log
     *
     * @returns {Complex}
     */
    log() {

        const { re, im } = this;

        if (im === 0 && re > 0) {
            //return new Complex(Math.log(a), 0);
        }

        return new Complex(
            logHypot(re, im),
            Math.atan2(im, re));
    }

    /**
     * Calculate the magnitude of the complex number
     *
     * @returns {number}
     */
    abs() {
        return hypot(this.re, this.im);
    }

    /**
     * Calculate the angle of the complex number
     *
     * @returns {number}
     */
    arg() {
        return Math.atan2(this.im, this.re);
    }

    /**
     * Calculate the sine of the complex number
     *
     * @returns {Complex}
     */
    sin() {
        // sin(c) = (e^b - e^(-b)) / (2i)

        const { re, im } = this;

        return new Complex(
            Math.sin(re) * cosh(im),
            Math.cos(re) * sinh(im));
    }

    /**
     * Calculate the cosine
     *
     * @returns {Complex}
     */
    cos() {
        // cos(z) = (e^b + e^(-b)) / 2

        const { re, im } = this;

        return new Complex(
            Math.cos(re) * cosh(im),
            -Math.sin(re) * sinh(im));
    }

    /**
     * Calculate the tangent
     *
     * @returns {Complex}
     */
    tan() {
        // tan(c) = (e^(ci) - e^(-ci)) / (i(e^(ci) + e^(-ci)))

        const a = 2 * this.re;
        const b = 2 * this.im;
        const d = Math.cos(a) + cosh(b);

        return new Complex(
            Math.sin(a) / d,
            sinh(b) / d);
    }

    /**
     * Calculate the cotangent
     *
     * @returns {Complex}
     */
    cot() {
        // cot(c) = i(e^(ci) + e^(-ci)) / (e^(ci) - e^(-ci))

        const a = 2 * this.re;
        const b = 2 * this.im;
        const d = Math.cos(a) - cosh(b);

        return new Complex(
            -Math.sin(a) / d,
            sinh(b) / d);
    }

    /**
     * Calculate the secant
     *
     * @returns {Complex}
     */
    sec() {
        // sec(c) = 2 / (e^(ci) + e^(-ci))

        const { re, im } = this;
        const d = 0.5 * cosh(2 * im) + 0.5 * Math.cos(2 * re);

        return new Complex(
            Math.cos(re) * cosh(im) / d,
            Math.sin(re) * sinh(im) / d);
    }

    /**
     * Calculate the cosecans
     *
     * @returns {Complex}
     */
    csc() {
        // csc(c) = 2i / (e^(ci) - e^(-ci))

        const { re, im } = this;
        const d = 0.5 * cosh(2 * im) - 0.5 * Math.cos(2 * re);

        return new Complex(
            Math.sin(re) * cosh(im) / d,
            -Math.cos(re) * sinh(im) / d);
    }

    /**
     * Calculate the complex arcus sinus
     *
     * @returns {Complex}
     */
    asin() {
        // asin(c) = -i * log(ci + sqrt(1 - c^2))

        const { re, im } = this;

        const t1 = new Complex(
            im * im - re * re + 1,
            -2 * re * im).sqrt();

        const t2 = new Complex(
            t1.re - im,
            t1.im + re).log();

        return new Complex(t2.im, -t2.re);
    }

    /**
     * Calculate the complex arcus cosinus
     *
     * @returns {Complex}
     */
    acos() {
        // acos(c) = i * log(c - i * sqrt(1 - c^2))

        const { re, im } = this;

        const t1 = new Complex(
            im * im - re * re + 1,
            -2 * re * im).sqrt();

        const t2 = new Complex(
            t1.re - im,
            t1.im + re).log();

        return new Complex(Math.PI / 2 - t2.im, t2.re);
    }

    /**
     * Calculate the complex arcus tangent
     *
     * @returns {Complex}
     */
    atan() {
        // atan(c) = i / 2 log((i + x) / (i - x))

        const { re, im } = this;

        if (re === 0) {
            if (im === 1) {
                return new Complex(0, Infinity);
            }
            if (im === -1) {
                return new Complex(0, -Infinity);
            }
        }

        const d = re * re + (1.0 - im) * (1.0 - im);

        const t1 = new Complex(
            (1 - im * im - re * re) / d,
            -2 * re / d).log();

        return new Complex(-0.5 * t1.im, 0.5 * t1.re);
    }

    /**
     * Calculate the complex arcus cotangent
     *
     * @returns {Complex}
     */
    acot() {
        // acot(c) = i / 2 log((c - i) / (c + i))

        const { re, im } = this;

        if (im === 0) {
            return new Complex(Math.atan2(1, re), 0);
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).atan()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).atan();
    }

    /**
     * Calculate the complex arcus secant
     *
     * @returns {Complex}
     */
    asec() {
        // asec(c) = -i * log(1 / c + sqrt(1 - i / c^2))

        const { re, im } = this;

        if (re === 0 && im === 0) {
            return new Complex(0, Infinity);
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).acos()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).acos();
    }

    /**
     * Calculate the complex arcus cosecans
     *
     * @returns {Complex}
     */
    acsc() {
        // acsc(c) = -i * log(i / c + sqrt(1 - 1 / c^2))

        const { re, im } = this;

        if (re === 0 && im === 0) {
            return new Complex(Math.PI / 2, Infinity);
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).asin()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).asin();
    }

    /**
     * Calculate the complex sinh
     *
     * @returns {Complex}
     */
    sinh() {
        // sinh(c) = (e^c - e^-c) / 2

        const { re, im } = this;

        return new Complex(
            sinh(re) * Math.cos(im),
            cosh(re) * Math.sin(im));
    }

    /**
     * Calculate the complex cosh
     *
     * @returns {Complex}
     */
    cosh() {
        // cosh(c) = (e^c + e^-c) / 2

        const { re, im } = this;

        return new Complex(
            cosh(re) * Math.cos(im),
            sinh(re) * Math.sin(im));
    }

    /**
     * Calculate the complex tanh
     *
     * @returns {Complex}
     */
    tanh() {
        // tanh(c) = (e^c - e^-c) / (e^c + e^-c)

        const a = 2 * this.re;
        const b = 2 * this.im;
        const d = cosh(a) + Math.cos(b);

        return new Complex(
            sinh(a) / d,
            Math.sin(b) / d);
    }

    /**
     * Calculate the complex coth
     *
     * @returns {Complex}
     */
    coth() {
        // coth(c) = (e^c + e^-c) / (e^c - e^-c)

        const a = 2 * this.re;
        const b = 2 * this.im;
        const d = cosh(a) - Math.cos(b);

        return new Complex(
            sinh(a) / d,
            -Math.sin(b) / d);
    }

    /**
     * Calculate the complex coth
     *
     * @returns {Complex}
     */
    csch() {
        // csch(c) = 2 / (e^c - e^-c)

        const { re, im } = this;
        const d = Math.cos(2 * im) - cosh(2 * re);

        return new Complex(
            -2 * sinh(re) * Math.cos(im) / d,
            2 * cosh(re) * Math.sin(im) / d);
    }

    /**
     * Calculate the complex sech
     *
     * @returns {Complex}
     */
    sech() {
        // sech(c) = 2 / (e^c + e^-c)

        const { re, im } = this;
        const d = Math.cos(2 * im) + cosh(2 * re);

        return new Complex(
            2 * cosh(re) * Math.cos(im) / d,
            -2 * sinh(re) * Math.sin(im) / d);
    }

    /**
     * Calculate the complex asinh
     *
     * @returns {Complex}
     */
    asinh() {
        // asinh(c) = log(c + sqrt(c^2 + 1))

        let tmp = this.im;
        this.im = -this.re;
        this.re = tmp;
        const res = this.asin();

        this.re = -this.im;
        this.im = tmp;
        tmp = res.re;

        res.re = -res.im;
        res.im = tmp;
        return res;
    }

    /**
     * Calculate the complex acosh
     *
     * @returns {Complex}
     */
    acosh() {
        // acosh(c) = log(c + sqrt(c^2 - 1))

        const res = this.acos();
        if (res.im <= 0) {
            const tmp = res.re;
            res.re = -res.im;
            res.im = tmp;
        } else {
            const tmp = res.im;
            res.im = -res.re;
            res.re = tmp;
        }
        return res;
    }

    /**
     * Calculate the complex atanh
     *
     * @returns {Complex}
     */
    atanh() {
        // atanh(c) = log((1+c) / (1-c)) / 2

        const { re, im } = this;

        const noIM = re > 1 && im === 0;
        const oneMinus = 1 - re;
        const onePlus = 1 + re;
        const d = oneMinus * oneMinus + im * im;

        const x = (d !== 0)
            ? new Complex(
                (onePlus * oneMinus - im * im) / d,
                (im * oneMinus + onePlus * im) / d)
            : new Complex(
                (re !== -1) ? (re / 0) : 0,
                (im !== 0) ? (im / 0) : 0);

        const temp = x.re;
        x.re = logHypot(x.re, x.im) / 2;
        x.im = Math.atan2(x.im, temp) / 2;
        if (noIM) {
            x.im = -x.im;
        }
        return x;
    }

    /**
     * Calculate the complex acoth
     *
     * @returns {Complex}
     */
    acoth() {
        // acoth(c) = log((c+1) / (c-1)) / 2

        const { re, im } = this;

        if (re === 0 && im === 0) {
            return new Complex(0, Math.PI / 2);
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).atanh()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).atanh();
    }

    /**
     * Calculate the complex acsch
     *
     * @returns {Complex}
     */
    acsch() {
        // acsch(c) = log((1+sqrt(1+c^2))/c)

        const { re, im } = this;

        if (im === 0) {
            return new Complex(
                (re !== 0)
                    ? Math.log(re + Math.sqrt(re * re + 1))
                    : Infinity, 0);
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).asinh()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).asinh();
    }

    /**
     * Calculate the complex asech
     *
     * @returns {Complex}
     */
    asech() {
        // asech(c) = log((1+sqrt(1-c^2))/c)

        const { re, im } = this;

        if (this.isZero()) {
            return Complex.INFINITY;
        }

        const d = re * re + im * im;
        return (d !== 0)
            ? new Complex(
                re / d,
                -im / d).acosh()
            : new Complex(
                (re !== 0) ? re / 0 : 0,
                (im !== 0) ? -im / 0 : 0).acosh();
    }

    /**
     * Calculate the complex inverse 1/z
     *
     * @returns {Complex}
     */
    inverse() {
        // 1 / 0 = Infinity and 1 / Infinity = 0
        if (this.isZero()) {
            return Complex.INFINITY;
        }

        if (this.isInfinite()) {
            return Complex.ZERO;
        }

        const { re, im } = this;

        const d = re * re + im * im;

        return new Complex(re / d, -im / d);
    }

    /**
     * Returns the complex conjugate
     *
     * @returns {Complex}
     */
    conjugate() {
        return new Complex(this.re, -this.im);
    }

    /**
     * Gets the negated complex number
     *
     * @returns {Complex}
     */
    neg() {
        return new Complex(-this.re, -this.im);
    }

    /**
     * Ceils the actual complex number
     *
     * @returns {Complex}
     */
    ceil(places?: number) {

        places = Math.pow(10, places ?? 0);

        return new Complex(
            Math.ceil(this.re * places) / places,
            Math.ceil(this.im * places) / places);
    }

    /**
     * Floors the actual complex number
     *
     * @returns {Complex}
     */
    floor(places?: number) {

        places = Math.pow(10, places ?? 0);

        return new Complex(
            Math.floor(this.re * places) / places,
            Math.floor(this.im * places) / places);
    }

    /**
     * Ceils the actual complex number
     *
     * @returns {Complex}
     */
    round(places?: number) {

        places = Math.pow(10, places ?? 0);

        return new Complex(
            Math.round(this.re * places) / places,
            Math.round(this.im * places) / places);
    }

    /**
     * Compares two complex numbers
     *
     * **Note:** new Complex(Infinity).equals(Infinity) === false
     *
     * @returns {boolean}
     */

    equals(z: { re: number, im: number }): boolean
    equals(z: { r: number, phi: number }): boolean
    equals(re: number, im: number): boolean
    equals(z: [number, number]): boolean
    equals(re: number): boolean
    equals(z: string): boolean

    equals(a?: any, b?: any) {

        const z = new Complex(a, b);

        return Math.abs(z.re - this.re) <= Complex.EPSILON &&
            Math.abs(z.im - this.im) <= Complex.EPSILON;
    }

    /**
     * Clones the actual object
     *
     * @returns {Complex}
     */
    clone() {
        return new Complex(this.re, this.im);
    }

    /**
     * Gets a string of the actual complex number
     *
     * @returns {string}
     */
    toString() {

        let { re, im } = this;
        let ret = "";

        if (this.isNaN()) {
            return 'NaN';
        }

        if (this.isInfinite()) {
            return 'Infinity';
        }

        if (Math.abs(re) < Complex.EPSILON) {
            re = 0;
        }

        if (Math.abs(im) < Complex.EPSILON) {
            im = 0;
        }

        // If is real number
        if (im === 0) {
            return ret + re;
        }

        if (re !== 0) {
            ret += re;
            ret += " ";
            if (im < 0) {
                im = -im;
                ret += "-";
            } else {
                ret += "+";
            }
            ret += " ";
        } else if (im < 0) {
            im = -im;
            ret += "-";
        }

        if (1 !== im) { // b is the absolute imaginary part
            ret += im;
        }
        return ret + "i";
    }

    /**
     * Returns the actual number as a vector
     *
     * @returns {Array}
     */
    toVector(): [number, number] {
        return [this.re, this.im];
    }

    /**
     * Returns the actual real value of the current object
     *
     * @returns {number|null}
     */
    valueOf(): number | null {

        if (this.im === 0) {
            return this.re;
        }
        return null;
    }

    /**
     * Determines whether a complex number is not on the Riemann sphere.
     *
     * @returns {boolean}
     */
    isNaN() {
        return isNaN(this.re) || isNaN(this.im);
    }

    /**
     * Determines whether or not a complex number is at the zero pole of the
     * Riemann sphere.
     *
     * @returns {boolean}
     */
    isZero() {
        return this.im === 0 && this.re === 0;
    }

    /**
     * Determines whether a complex number is not at the infinity pole of the
     * Riemann sphere.
     *
     * @returns {boolean}
     */
    isFinite() {
        return isFinite(this.re) && isFinite(this.im);
    }

    /**
     * Determines whether or not a complex number is at the infinity pole of the
     * Riemann sphere.
     *
     * @returns {boolean}
     */
    isInfinite() {
        return !(this.isNaN() || this.isFinite());
    }
};

