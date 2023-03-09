const {JSONPath} = require('jsonpath-plus');

const CodeError = require('../code-error.js');

module.exports = function getProjectJsonpathMatches(project, ruleDef={}){
	let matches;
	const path = ruleDef.match
	if(!path){
		throw new Error(`\`match\` JSONPath expression required in rule ${ruleDef.$name}`)
	}

	// Some rules really benefit from match expressions with simple logic, but for security
	// I want to restrict arbitrary JS, and instead only offer some simple operators
	const expression = (path.match(/\(.*\)/)||[])[0];
	if(expression && !expression.match(/^\(@\.[_a-zA-Z][_a-zA-Z0-9]*((!==?|===?)("[^"]*"|'[^']*'|undefined))?\)$/)){
	throw new CodeError(`To prevent unintended code execution, JSONPath conditions are currently limited to only a single alphanumeric+underscore property existence check or a single equality check against a string or undefined. Please also omit any unnecessary whitespace. The following expression was rejected: ${expression}`)
	}

	try {
		matches = JSONPath({
			json: project,
			path: ruleDef.match,
			//preventEval: true, // Since we are strictly limiting the expressions allowed via a narrow regex, tentatively this seems ok
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