const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: "./public/js/main.ts",
    watch: true,
    output: {
        path: path.resolve(__dirname, 'public', 'js'),
        compareBeforeEmit: false,
        filename: "bundle.js"
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                      loader: "css-loader",
                      options: {
                        sourceMap: true,
                      },
                    },
                    {
                      loader: "sass-loader",
                      options: {
                        sourceMap: true,
                      },
                    },
                ],
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "[name].css",
          chunkFilename: "[id].css",
        }),
    ],
}
