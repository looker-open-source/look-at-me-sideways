const {JSONPath} = require('jsonpath-plus');

const CodeError = require('../code-error.js');

module.exports = function getProjectJsonpathMatches(project, ruleDef={}){
	const path = ruleDef.match
	if(!path){
		throw new Error(`\`match\` JSONPath expression required in rule ${ruleDef.$name}`)
	}

	// Some rules really benefit from match expressions with simple logic, but for security
	// I want to restrict arbitrary JS, and instead only offer some simple operators
	const expression = (path.match(/\(.*\)/)||[])[0];
	if(expression && !expression.match(/^\(@\.[_a-zA-Z][_a-zA-Z0-9]*((!==?|===?)("[^"]*"|'[^']*'|true|false|undefined))?\)$/)){
	throw new CodeError(`To prevent unintended code execution, JSONPath conditions are currently limited to only a single alphanumeric+underscore property existence check or a single equality check against a string, boolean, or undefined. Please also omit any unnecessary whitespace. The following expression was rejected: ${expression}`)
	}

	let matches
	// try {
		matches = JSONPath({
			json: project,
			path: ruleDef.match,
			//preventEval: true, // Since we are strictly limiting the expressions allowed via a narrow regex, tentatively this seems ok
			//autostart: false,
			resultType: "all"
		});
	if(!matches){
		throw new Error("Missing match results")
	}
	// } catch (e) {
	// 	console.error(e)
	// 	throw new CodeError(`Invalid jsonpath in rule:${ruleDef.$name}/match: ${ruleDef.match}`, 1);
	// }

	matches = matches.map(m =>({
		value: m.value,
		project,
		path: m.path
			.slice(2,-1)
			.split(/(?<=['0-9])\]\[(?=['0-9])/) //TODO: More sophisticated approach for JSON keys that may contain this string?
			.map(part=>tryJsonParse(part.replace(/^'/,'"').replace(/'$/,'"'), part)) //May be a string or a number
	}))

	return matches
}

function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
}