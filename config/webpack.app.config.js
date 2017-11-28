const path = require('path')
const merge = require('webpack-merge')
const base = require('./webpack.base.config')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = env => {
  return merge(base(env), {
    entry: {
      background: './src/background.js',
      app: './src/app.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './src/index.html',
        chunks: ['app']
      })
    ],
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, '../app')
    }
  })
}
