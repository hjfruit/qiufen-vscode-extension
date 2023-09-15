const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
  mode: 'production',
  entry: {
    dist_client: './client/src/extension.ts',
    dist_server: './server/src/server.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs-module',
  },
  externals: [nodeExternals()],
  resolve: {
    // alias: {
    // // 这样配置后 @ 可以指向 src 目录
    // '@': path.resolve(__dirname, 'src'),
    // },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  },
  plugins: [new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      },
    ],
  },
  devtool: 'inline-source-map',
  infrastructureLogging: {
    level: 'log',
  },
}

module.exports = [extensionConfig]
