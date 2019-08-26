const path = require('path')
const dot = require('dot');
const templateFunctions = require('./template-functions.js');

dot.templateSettings = {
	...dot.templateSettings,
	evaluate: /\{\{!([\s\S]+?)\}\}/g,
	interpolate: /\{\{=([\s\S]+?)\}\}/g,
	encode: /\{\{&([\s\S]+?)\}\}/g,
	conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
	iterate: /\{\{\*\s*(?:\}\}|([\s\S]+?)\s*:\s*([\w$]+)\s*(?::\s*([\w$]+))?\s*\}\})/g,
	varname: 'ctx',
	strip: false,
};

dot.process({path: path.join(__dirname, 'templates')});

const templates = {
	developer:	require('./templates/developer'),
	issues:		require('./templates/issues'),
};

module.exports = {
	developer:	obj => templates.developer({...obj, fns:templateFunctions}),
	issues:		obj => templates.issues({...obj, fns:templateFunctions})
}