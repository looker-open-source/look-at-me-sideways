// By default webpack config files are not cross-compiled, so we use require
const common = require('./webpack-common.js')
const path = require('path')

module.exports = {
	...common,
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		...common.output,
		filename: "rule-sandbox-web-dev.js"
	},
	devServer: {
		hot: true,
		static:['static'],
		historyApiFallback: {
			index: 'index.html'
			}
		}
	}