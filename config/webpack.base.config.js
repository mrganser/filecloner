const path = require('path')
const nodeExternals = require('webpack-node-externals')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

module.exports = env => {
  return {
    mode: env,
    target: 'node',
    node: {
      __dirname: false,
      __filename: false
    },
    externals: [nodeExternals()],
    devtool: env === 'development' ? 'cheap-source-map' : '',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          loader: 'file-loader?name=fonts/[name].[ext]'
        },
        {
          test: /\.png$/,
          loader: 'url-loader?mimetype=image/png'
        }
      ]
    },
    resolve: {
      alias: {
        env: path.resolve(__dirname, `./env_${env}.json`)
      },
      extensions: ['.js', '.jsx', '.json'],
      modules: [
        path.join(__dirname, 'src'),
        'node_modules'
      ]
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({ clearConsole: false })
    ]
  }
}
