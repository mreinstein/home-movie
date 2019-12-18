/*eslint-env node*/
import commonjs from 'rollup-plugin-commonjs';
import resolve  from 'rollup-plugin-node-resolve';


export default {
  input: 'client.js',
  output: {
    file: 'public/bundle.js',
    name: 'video',
    format: 'iife'
  },
    plugins: [
      resolve(),
      commonjs()
    ]
};
