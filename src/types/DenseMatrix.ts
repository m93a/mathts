import { symbols, Tensor, InstanceOf, InstanceWithMethods, isTensor } from '@m93a/arithmetic-types'
import { arraySize, getArrayDataType, resize, validateIndex } from '../utils/array'
import { clone } from '../utils/object'
import { mapToMultidimArray, retrieveTopArrayByIndex } from '../utils/tensor'
import { isArray, typeOf } from '../utils/is'
import { DimensionError } from '../error/DimensionError'
import { format } from '../utils/string'

type TensorInstance<T, F> = InstanceOf<Tensor<T, F>>
type MultidimArray<F> = F[] | MultidimArray<F>[]

export function isDenseMatrix(x: any): x is DenseMatrix<any> {
    return typeof x === 'object' && x[symbols.Tensor] && x.type === 'DenseMatrix'
}

interface SerializedDenseMatrix<F = any> {
    mathjs: 'DenseMatrix'
    data: MultidimArray<F>
    size: number[]
    datatype?: any
}

export function isSerializedDenseMatrix(x: any): x is SerializedDenseMatrix {
    return typeof x === 'object' && x.mathjs === 'DenseMatrix' && isArray(x.data) && isArray(x.size)
}

/**
 * Preprocess data, which can be an Array or DenseMatrix with nested Arrays and
 * Matrices. Replaces all nested Matrices with Arrays
 * @memberof DenseMatrix
 * @param {Array} data
 * @return {Array} data
 */
function preprocess<F> (data: MultidimArray<F | DenseMatrix<F>>): MultidimArray<F> {
    for (let i = 0, ii = data.length; i < ii; i++) {
        const elem = data[i]
        if (isArray(elem)) {
            data[i] = preprocess<F>(elem)
        } else if (elem && isDenseMatrix(elem)) {
            data[i] = preprocess<F>(elem.valueOf())
        }
    }

    return data as MultidimArray<F>
}


/**
 * Dense Matrix implementation. A regular, dense matrix, supporting multi-dimensional matrices. This is the default matrix type.
 * @enum {{ value, index: number[] }}
 */
export class DenseMatrix<F = number>
implements InstanceWithMethods<Tensor<DenseMatrix<F>, F>>
{
    public readonly [symbols.Tensor]: true
    public readonly type = 'DenseMatrix'
    public readonly isDenseMatrix = true

    #data: MultidimArray<F>
    #size: number[]
    #datatype: any

    get size(): readonly number[] { return [...this.#size] }

    get datatype() {
        this.#datatype = this.#datatype ?? getArrayDataType(this.#data, typeOf)
        return this.#datatype
    }


    constructor(data: MultidimArray<F> | TensorInstance<any, F> | SerializedDenseMatrix<F>, datatype?: any)
    {
        if (isArray(data)) {
            this.#data = preprocess(data)
            this.#size = arraySize(this.#data)
        }
        else if (isDenseMatrix(data)) {
            this.#data = clone(data.#data)
            this.#size = [...data.size]
            this.#datatype = datatype ?? data.#datatype
        }
        else if (isSerializedDenseMatrix(data)) {
            this.#data = clone(data.data)
            this.#size = [...data.size]
            this.#datatype = datatype ?? data.datatype
        }
        else if (isTensor(data)) {
            const arithmetics = data[symbols.Arithmetics]
            const size = [...arithmetics.size(data)]
            this.#size = size

            this.#data = mapToMultidimArray(data, (v: F) => clone(v))
        }
        else {
            throw new TypeError('Unsupported type of data (' + typeOf(data) + ')')
        }
    }


    clone(this: DenseMatrix<F>) {
        return new DenseMatrix<F>(this)
    }


    /**
     * Get a single element from the matrix.
     * @memberof DenseMatrix
     * @param {number[]} index   Zero-based index
     * @return {*} value
     */
    get(this: DenseMatrix<F>, index: number[]) {
        if (!isArray(index)) { throw new TypeError('Array expected') }
        if (index.length !== this.#size.length) { throw new DimensionError(index.length, this.#size.length) }

        // check index
        for (let x = 0; x < index.length; x++) { validateIndex(index[x], this.#size[x]) }

        let data = this.#data
        for (let i = 0, ii = index.length; i < ii; i++) {
            const indexI = index[i]
            validateIndex(indexI, data.length)
            data = data[indexI] as MultidimArray<F>
        }

        return data
    }


    /**
     * Replace a single element in the matrix.
     * @memberof DenseMatrix
     * @param {number[]} index   Zero-based index
     * @param {*} value
     * @return {DenseMatrix} self
     */
     set(this: DenseMatrix<F>, index: number[], value: F) {
        if (!isArray(index)) { throw new TypeError('Array expected') }
        if (index.length < this.#size.length) { throw new DimensionError(index.length, this.#size.length, '<') }

        const lastI = index[index.length - 1]
        const arr = retrieveTopArrayByIndex(this.#data, index)

        arr[lastI] = value

        return this
    }


    /**
     * Resize the matrix to the given size. Returns a copy of the matrix when
     * `copy=true`, otherwise return the matrix itself (resize in place).
     *
     * @memberof DenseMatrix
     * @param {number[]} size           The new size the matrix should have.
     * @param {*} [defaultValue=0]      Default value, filled in on new entries.
     *                                  If not provided, the matrix elements will
     *                                  be filled with zeros.
     * @param {boolean} [copy]          Return a resized copy of the matrix
     *
     * @return {Matrix}                 The resized matrix
     */
    resize(this: DenseMatrix<F>, size: number[], defaultValue: F, copy: boolean = false) {
        const matrix = copy ? this.clone() : this

        matrix.#size = [...size]
        matrix.#data = resize(matrix.#data, matrix.#size, defaultValue)

        return matrix
    }



    /**
     * Create a new matrix with the results of the callback function executed on
     * each entry of the matrix.
     * @memberof DenseMatrix
     * @param {Function} callback   The callback function is invoked with three
     *                              parameters: the value of the element, the index
     *                              of the element, and the Matrix being traversed.
     *
     * @return {DenseMatrix} matrix
     */
     map<R>(this: DenseMatrix<F>, callback: (value: F, index: number[], matrix: DenseMatrix<F>) => R) {
        const self = this
        const recurse = (value: F|MultidimArray<F>, index: number[]): R|MultidimArray<R> => {
            if (isArray(value)) {
                return value.map( (child, i) => recurse(child, index.concat(i)) ) as MultidimArray<R>
            } else {
                return callback(value, index, self)
            }
        }

        const data = recurse(this.#data, []) as MultidimArray<R>
        return new DenseMatrix(data)
    }


    /**
     * Execute a callback function on each entry of the matrix.
     * @memberof DenseMatrix
     * @param {Function} callback   The callback function is invoked with three
     *                              parameters: the value of the element, the index
     *                              of the element, and the Matrix being traversed.
     */
     forEach(callback: (value: F, index: number[], matrix: DenseMatrix<F>) => void) {
        const self = this
        const recurse = (value: F|MultidimArray<F>, index: number[]) => {
            if (isArray(value)) {
                value.forEach( (child, i) => recurse(child, index.concat(i)) )
            } else {
                callback(value, index, self)
            }
        }
        recurse(this.#data, [])
    }


    /**
     * Iterate over the matrix elements
     * @return {Iterable<{ value, index: number[] }>}
     */
    [Symbol.iterator] = function* () {
        const recurse = function* (value: F|MultidimArray<F>, index: number[]) {
            if (isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    yield* recurse(value[i], index.concat(i))
                }
            } else {
                yield ({ value, index })
            }
        }
        yield* recurse(this._data, [])
    }


    /**
     * Returns an array containing the rows of a 2D matrix
     * @returns {Array<Matrix>}
     */
    rows () {
        const result = []

        const s = this.size
        if (s.length !== 2) {
            throw new TypeError('Rows can only be returned for a 2D matrix.')
        }

        const data = this.#data
        for (const row of data) {
            result.push(new DenseMatrix([row]))
        }

        return result
    }


    /**
     * Returns an array containing the columns of a 2D matrix
     * @returns {Array<Matrix>}
     */
    columns () {
        const result = []

        const s = this.size
        if (s.length !== 2) {
            throw new TypeError('Rows can only be returned for a 2D matrix.')
        }

        const data = this.#data
        for (let i = 0; i < s[1]; i++) {
            const col = data.map(row => [row[i]])
            result.push(new DenseMatrix(col))
        }

        return result
    }


    /**
     * Create an Array with a copy of the data of the DenseMatrix
     * @memberof DenseMatrix
     * @returns {Array} array
     */
    toArray(): MultidimArray<F> {
        return clone(this.#data)
    }


    /**
     * Get the primitive value of the DenseMatrix: a multidimensional array
     * @memberof DenseMatrix
     * @returns {Array} array
     */
    valueOf(): MultidimArray<F> {
        return this.#data
    }


    /**
     * Get a string representation of the matrix, with optional formatting options.
     * @memberof DenseMatrix
     * @param {Object | number | Function} [options]  Formatting options. See
     *                                                lib/utils/number:format for a
     *                                                description of the available
     *                                                options.
     * @returns {string} str
     */
    format(options) {
        return format(this.#data, options)
    }


    /**
     * Get a string representation of the matrix
     * @memberof DenseMatrix
     * @returns {string} str
     */
    toString() {
        return format(this.#data)
    }


    /**
     * Get a JSON representation of the matrix
     * @memberof DenseMatrix
     * @returns {Object}
     */
    toJSON(): SerializedDenseMatrix<F> {
        return {
            mathjs: 'DenseMatrix',
            data: this.#data,
            size: this.#size,
            datatype: this.#datatype
        }
    }


    /**
     * Generate a matrix from a JSON object
     * @memberof DenseMatrix
     * @param {Object} json  An object structured like
     *                       `{"mathjs": "DenseMatrix", data: [], size: []}`,
     *                       where mathjs is optional
     * @returns {DenseMatrix}
     */
    static fromJSON(json: any) {
        if (!isSerializedDenseMatrix(json)) throw new TypeError('The object is not a serialized DenseMatrix.')
        return new DenseMatrix(json)
    }
}



// Test whether all static methods are implemented
// TODO remove when `implements static` arrives
// https://github.com/microsoft/TypeScript/issues/33892#issuecomment-542440546
type Foo = { _foo: 42 }
const __testStaticMethods: Tensor<DenseMatrix<Foo>, Foo> = DenseMatrix




