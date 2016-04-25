/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import webpack from 'webpack';
import uglifyPluginFactory from './plugins/uglify';
import { statsPlugin, statsPluginOptions } from './plugins/stats';

/**
 * Generate the webpack config for the main application bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the main app bundle.
 */
export default function mainConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///main/[resource-path]';
  const reactDOMServerStub = 'utils/react/reactDOMServer';
  const additionalPlugins = [];
  const definitions = {
    DEBUG: type === 'dev',
    'process.env': {
      NODE_ENV: JSON.stringify(type === 'dev' ? 'development' : 'production')
    }
  };
  const config = statsPluginOptions(settings, {
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    entry: `./${settings.src.baseDir}/client.js`,
    output: {
      path: settings.dist.scripts,
      publicPath: settings.web.scripts
    },
    module: {
      loaders: [
        {
          test: /\.(js|jsx)$/,
          exclude: /^\/node_modules/,
          loader: 'babel-loader'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin(definitions),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.NormalModuleReplacementPlugin(
        /lodash\.assign/, require.resolve('object-assign')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /object\-assign/, require.resolve('object-assign')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /ReactDOMServer/, require.resolve(reactDOMServerStub)
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^react\-?$/, require.resolve('react')
      )
    ],
    node: {
      setImmediate: false
    },
    stats: {
      colors: true
    }
  });

  if (type === 'dev') {
    config.output.filename = '[name].js';
    config.output.chunkFilename = '[name].js';
    config.keepalive = true;
    config.watch = true;
  } else {
    config.output.filename = '[name].[chunkhash].min.js';
    config.output.chunkFilename = '[name].[chunkhash].min.js';
    config.progress = false;
    if (type === 'prod') {
      additionalPlugins.push(uglifyPluginFactory());
    }
  }

  if (type !== 'prod') {
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
    config.devtool = 'source-map';
  }

  Array.prototype.push.apply(config.plugins, additionalPlugins.concat(
    function () {
      const statsFile = type === 'prod' ? 'webpack-stats-main.json' : false;
      return statsPlugin(this, statsFile);
    }
  ));

  return config;
}