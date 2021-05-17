import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'


const teserOptions = {
    compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true
    }
}

const babelOptions = {
    presets: [
        ['@babel/preset-env', {
        useBuiltIns: 'usage',
        debug: true,
        corejs: 3
        }]
    ],
    ignore: [
        'node_modules'
    ]
}

const tsOptions = {
    check: false,
    abortOnError: false
}



