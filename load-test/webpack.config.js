const path = require("node:path");

module.exports = {
  mode: "production",
  entry: {
    script: "./src/script.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"), // eslint-disable-line
    libraryTarget: "commonjs",
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      { test: /\.js$/, use: "babel-loader" },
      { test: /\.ts$/, use: "ts-loader" }
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: "web",
  externals: /k6(\/.*)?/,
};
