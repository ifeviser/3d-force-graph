import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import postCss from 'rollup-plugin-postcss';
import { terser } from "rollup-plugin-terser";
import dts from 'rollup-plugin-dts';
import { name, homepage, version, dependencies, unscopedName } from './package.json';

const umdConf = {
  format: 'umd',
  name: 'ForceGraph3D',
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  { // UMD
    input: 'src/index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${unscopedName}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${unscopedName}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      postCss({ plugins: [] }),
      babel({ exclude: 'node_modules/**' }),
      resolve(),
      commonJs()
    ]
  },
  { // commonJs and ES modules
    input: 'src/index.js',
    output: [
      {
        format: 'cjs',
        file: `dist/${unscopedName}.common.js`,
        exports: 'auto'
      },
      {
        format: 'es',
        file: `dist/${unscopedName}.module.js`
      }
    ],
    external: [
      ...Object.keys(dependencies || {}),
      'three/examples/jsm/controls/DragControls.js'
    ],
    plugins: [
      postCss({ plugins: [] }),
      babel()
    ]
  },
  { // expose TS declarations
    input: 'src/index.d.ts',
    output: [{
      file: `dist/${unscopedName}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()],
  }
];