const fs = require('fs');
const { rollup } = require('rollup');
const { minify } = require('terser');
const pretty = require('pretty-bytes');
const sizer = require('gzip-size');
const pkg = require('./package');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const umd = pkg['umd:main'];
const date = new Date();

const banner = `/*
 * vendOS v${ pkg.version }
 * (c) ${ date.getFullYear() } Social Vend Ltd. trading as vendOS 
 * Released under the MIT license
 * vendos.io
 */
`;

console.info('Compiling.. ⌛');

rollup({
    input: 'src/index.js',
    external: ['wolfy87-eventemitter']
}).then(bun => {
  bun.write({
    banner,
    format: 'cjs',
    file: pkg.main,
  });

  bun.write({
    banner,
    format: 'es',
    file: pkg.module,
  });

}).catch(console.error);

rollup({
  input: 'src/index.js',
  plugins: [ 
    commonjs({
      namedExports: {
        'wolfy87-eventemitter': [ 'named' ]
      }
    }),
    resolve() 
  ]}).then(bun => {
  bun.write({
    banner,
    file: umd,
    format: 'umd',
    name: pkg['umd:name'],
  }).then(_ => {
    const data = fs.readFileSync(umd, 'utf8');
    const { code } = minify(data);
    fs.writeFileSync(umd, `${banner}\n${code}`);
    const int = sizer.sync(code);
    console.info('Compilation complete! 🙌');
    console.info(`~> gzip size: ${ pretty(int) }`);
  }).catch(console.error);
}).catch(console.error);