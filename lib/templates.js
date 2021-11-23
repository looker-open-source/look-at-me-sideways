const path = require('path');
const fs = require('fs');
const dot = require('dot');
const templateFunctions = require('./template-functions.js');

const read = (fp) => (new Promise((res, rej) => fs.readFile(
	path.join(__dirname, fp),
	{encoding: 'utf8'},
	(err, data) => err?rej(err):res(data),
)));

const templateSettings = {
	...dot.templateSettings,
	evaluate: /\{\{!([\s\S]+?)\}\}/g,
	interpolate: /\{\{=([\s\S]+?)\}\}/g,
	encode: /\{\{&([\s\S]+?)\}\}/g,
	conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
	iterate: /\{\{\*\s*(?:\}\}|([\s\S]+?)\s*:\s*([\w$]+)\s*(?::\s*([\w$]+))?\s*\}\})/g,
	varname: 'ctx',
	strip: false,
};

// dot.process({path: path.join(__dirname, 'templates'), log: false, templateSettings});
// const templates = {
// 	developer:	require('./templates/developer'),
// 	issues:	require('./templates/issues'),
// };

const asyncDeveloperTemplate = read('./templates/developer.jst');
const asyncIssuesTemplate = read('./templates/issues.jst');

module.exports = Promise.all([asyncDeveloperTemplate, asyncIssuesTemplate])
	.then(([developerTemplate, issuesTemplate]) => {
		const developerFn = dot.template(developerTemplate, templateSettings);
		const issuesFn = dot.template(issuesTemplate, templateSettings);
		return {
			developer:	(obj) => developerFn({...obj, fns: templateFunctions}),
			issues:	(obj) => issuesFn({...obj, fns: templateFunctions}),
		};
	});
