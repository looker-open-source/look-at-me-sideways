const {JSONPath} = require('jsonpath-plus');

const CodeError = require('../code-error.js');

module.exports = function getMatches(project, ruleDef){
	let matches;
	try {
		matches = JSONPath({
			json: project,
			path: ruleDef.match,
			preventEval: true,
			resultType: "all"
		});
		if(!matches){throw new Error();}

		matches = matches.map(m =>({
			value: m.value, 
			path: m.path
				.slice(2,-1)
				.split(/(?<=['0-9])\]\[(?=['1-9])/) //TODO: More sophisticated approach for JSON keys that may contain this string?
				.map(part=>JSON.parse(part.replace(/^'/,'"').replace(/'$/,'"'))) //May be a string or a number
		}))
	} catch (e) {
		throw new CodeError(`Invalid jsonpath in rule:${ruleDef.$name}/match: ${ruleDef.match}`, 1);
	}
	return matches
}