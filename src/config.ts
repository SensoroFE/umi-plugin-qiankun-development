import type { PackageExternalInfo } from './types';

export const defaultPackageExternalMap: Record<string, PackageExternalInfo> = {
  react: {
    root: 'React',
    commonjs: 'react',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/react@17.0.2/umd/react.production.min.js',
  },
  'react-dom': {
    root: 'ReactDOM',
    commonjs: 'react-dom',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/react-dom@17.0.2/umd/react-dom.production.min.js',
  },
  '@lins/request': {
    root: 'LinsRequest',
    commonjs: '@lins/request',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/@lins/request@3.0.3/dist/request.min.js',
  },
  moment: {
    root: 'moment',
    commonjs: 'moment',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/moment@2.29.1/min/moment.min.js',
  },
  lodash: {
    root: '_',
    commonjs: 'lodash',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/lodash@4.17.15/lodash.min.js',
  },
  antd: {
    root: 'antd',
    commonjs: 'antd',
    script: 'https://lins-cdn.sensoro.com/lins-cdn/antd@4.23.2/dist/antd.min.js',
  },
};
