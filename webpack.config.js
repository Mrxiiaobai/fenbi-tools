const path = require("path");

module.exports = {
  entry: {
    main: "./src/views/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "out/views"),
    filename: "[name].js",
    publicPath: "./",
  },
  // devtool: "eval-source-map",
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
  },
  optimization: {
    usedExports: true,
    sideEffects: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        options: {},
      },
      {
        test: /\.(css|less)$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                auto: /\.module\.\w+$/i,
              },
            },
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "less-loader",
          },
        ],
      },
    ],
  },
  performance: {
    hints: false,
  },
};
