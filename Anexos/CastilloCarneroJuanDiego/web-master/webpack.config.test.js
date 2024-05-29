const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const merge = require('webpack-merge')

const base = require('./webpack.config')

module.exports = merge(base, {
  mode: 'development',

  plugins: [new MiniCssExtractPlugin()],

  // Karma configures entry & output for us, so disable these
  entry: null,
  output: null,
})
