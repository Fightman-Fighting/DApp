const webpack = require("webpack");
require('@wwtc/dotenv').config();

const PUBLIC_ENV = {
  API_URL: JSON.stringify(process.env.API_URL || ""),
  APP_VERSION: JSON.stringify(process.env.APP_VERSION || ""),
};

module.exports = {
  resolve: {
    fallback: { "url": require.resolve("url/") }
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': PUBLIC_ENV
    })
  ]
}
