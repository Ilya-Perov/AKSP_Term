const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },

plugins: [
  new HtmlWebpackPlugin({
    template: './public/index.html',
    minify: {
      removeComments: true,
      collapseWhitespace: true,
    },
  }),

  // 👇 ДОБАВЬ ЭТО
  new webpack.DefinePlugin({
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:8000'),
  }),
],


  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        pathRewrite: { '^/api': '/api' },
      },
    },
  },
};
