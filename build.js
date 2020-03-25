#!/usr/bin/env node
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
  name: 'vendOS',
  sourcemap: true
}

/* eslint-disable no-console */

if (argv.development) {

  console.info('Compiling and Watching... 👀')

  const watcher = watch({
    input: 'src/index.js',
    output: devOutputConfig,
    watch: {
      include: 'src/**'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  })

  watcher.on('event', event => {

    switch (event.code) {

      case 'START':
        console.info('Change detected')
        break
      case 'END':
        console.info('Bundle written')
        break
      case 'ERROR':
      case 'FATAL':
        console.error('Encountered an error:', event.error)
        break
    }
  })
} else {

  console.info('Compiling... ⌛')

  rollup({

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
    ]
  }).then(bun => {

    console.info('Compilation complete! 🙌')

    bun.write(cjsOutputConfig)
    bun.write(esOutputConfig)
    bun.write(umdOutputConfig)

  }).catch(console.error)
}
