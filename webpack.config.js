const path = require("path");

module.exports = {
  entry: "./public/js/main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public/js/dist"),
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
  mode: "production",
  devtool: "source-map",
};
