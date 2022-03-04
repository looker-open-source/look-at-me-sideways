const path = require('path')

// Status logs while build.
// const statsConfig = {    
//   colors: true,
//   hash: true,
//   timings: true,
//   assets: true,
//   chunks: true,
//   chunkModules: true,
//   modules: true,
//   children: true,
// }

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