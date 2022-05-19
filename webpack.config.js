const path = require('path');

module.exports = {
    entry: "./public/js/main.ts",
    output: {
        path: path.resolve(__dirname, 'public', 'js'),
        compareBeforeEmit: false,
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
}