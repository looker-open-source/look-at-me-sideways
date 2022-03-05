/*

 MIT License

 Copyright (c) 2022 Google LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

 const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../../index.jsx'),
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'undefined-filename.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-react"],
            // "plugins": [
            //   ["module-resolver", {
            //     "root": ["./src"],
            //   }],
            //   "@babel/plugin-proposal-class-properties"
            // ]
          }
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-react"],
          }
        },
      },
      {
        test: /\.s?css$/,
        use: [
            "style-loader",
            "css-loader"
        ]
      },
    //   {
    //     test: /.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    //     use: 'url-loader',
    //   },
    ],
  },
//   plugins: [
//     htmlWebpackPlugin,
//     new Dotenv({
//       path: path.resolve(process.cwd(), `config/${process.env.NODE_ENV}.env`),
//     }),
//   ],
//   stats: statsConfig,
}