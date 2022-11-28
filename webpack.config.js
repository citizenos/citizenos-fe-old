const path = require('path');
const webpack = require('webpack');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: "./public/js/main.ts",
    devtool: false,
    output: {
        path: path.resolve(__dirname, 'public', 'js'),
        compareBeforeEmit: true,
        filename: "citizenos-fe.bundle.js"
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
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
                        url: false,
                      },
                    },
                    {
                      loader: "sass-loader",
                      options: {
                        sourceMap: true,
                        sassOptions: {
                            outputStyle: "compressed",
                        },
                      }
                    },
                ],
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "../styles/citizenos-fe.bundle.css",
          chunkFilename: "[id].css",
        }),
        new webpack.ContextReplacementPlugin(
            // if you have anymore problems tweet me at @gdi2290
            // The (\\|\/) piece accounts for path separators for Windows and MacOS
            /(.+)?angular(\\|\/)core(.+)?/,
            path.join(__dirname, 'src'), // location of your src
            {} // a map of your routes
        ),
        new webpack.ProvidePlugin({
            qrcode: 'qrcode-generator'
        })
    ],
}
