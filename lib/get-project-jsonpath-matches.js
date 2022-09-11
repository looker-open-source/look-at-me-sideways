
const jsonpath = require('jsonpath');
const CodeError = require('./code-error.js');

module.exports = function getMatches(project, ruleDef){
	
	try {
		matches = jsonpath.nodes(project, ruleDef.match);
	} catch (e) {
		throw new CodeError(`Invalid jsonpath in manifest/rule:${ruleDef.$name}/match: ${ruleDef.match}`, 1);
	}
	return matches
}