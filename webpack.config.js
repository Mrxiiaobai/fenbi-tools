const path = require("path");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  mode: "production",
  entry: {
    main: "./src/views/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "out/views"),
    clean: true,
    filename: "[name].js",
    publicPath: "./",
  },
  // devtool: "eval-source-map",
  devtool: false,
  resolve: {
    extensions: [".json", ".js", ".tsx", ".ts"],
    // modules: [path.resolve(__dirname, "./node_modules")],
  },
  optimization: {
    usedExports: true,
    sideEffects: true,
    // splitChunks: {
    //   chunks: "all",
    //   minSize: 20000,
    //   maxSize: 244000,
    // },
    minimize: true,
    // minimizer: [
    //   new TerserPlugin({
    //     extractComments: false,
    //     terserOptions: {
    //       compress: {
    //         drop_console: true,
    //         drop_debugger: true,
    //         pure_funcs: ["console.log"],
    //       },
    //       mangle: true,
    //       format: {
    //         comments: false,
    //       },
    //     },
    //   }),
    // ],
  },
  module: {
    rules: [
      {
        // include: [path.resolve(__dirname, "./views")],
        test: /\.(ts|tsx)$/,
        // loader: "ts-loader",
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // 🔥 关闭类型检查，只做转译
            },
          },
          {
            loader: "babel-loader",
          },
        ],
        // options: {},
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
  // plugins: [new BundleAnalyzerPlugin({})],
};
