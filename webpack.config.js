const path = require("path");

module.exports = {
  entry: "./public/js/main.js",
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "public/js/dist"),
    clean: true, // Clean the output directory before emit
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  mode: "development",
  devtool: "source-map",
};
