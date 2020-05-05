const argv = require('yargs').argv
const {rollup, watch} = require('rollup')
const pkg = require('./package')
const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const terser = require('rollup-plugin-terser').terser
const filesize = require('rollup-plugin-filesize')
const builtins = require('rollup-plugin-node-builtins')
const umd = pkg['umd:main']
const date = new Date()
const banner = `/*
 * @license
 * vendOS v${ pkg.version }
 * (c) ${ date.getFullYear() } Social Vend Ltd. trading as vendOS
 * Released under the MIT license
 * vendos.io
 */
`

const {development} = argv

const umdOutputConfig = {
  banner,
  file: umd,
  format: 'umd',
  name: pkg['umd:name']
}

const cjsOutputConfig = {
  banner,
  format: 'cjs',
  file: pkg.main
}

const esOutputConfig = {
  banner,
  format: 'es',
  file: pkg.module
}

const devOutputConfig = {
  banner,
  format: 'iife',
  file: 'dev/vendos.dev.js',
  name: pkg['umd:name'],
  sourcemap: true
}

export default [

  {
    input: 'src/index.js',
    external: ['wolfy87-eventemitter'],
    plugins: [
      resolve(),
      commonjs({
        include: 'node_modules/**'
      }),
      terser({
        include: [/^.+\.min\.js$/],
        output: {
          comments: function(node, comment) {
            var text = comment.value
            var type = comment.type
            if (type == "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text)
            }
          }
        }
      }),
      filesize({
        render : function (options, bundle, {gzipSize}) {
      		return `${bundle.file} ~> gzip size: ${gzipSize}`
      	}
      })
    ],
    output: [
      umdOutputConfig,
      cjsOutputConfig,
      esOutputConfig,
      devOutputConfig
    ],
    watch: development ? {include: 'src/**'} : false
  }
]
