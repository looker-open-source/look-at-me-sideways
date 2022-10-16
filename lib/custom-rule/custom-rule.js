
const defaultConsole = console;
const noopConsole = {error: ()=>{}}
const getProjectJsonpathMatches = require('../get-project-jsonpath-matches.js');
const ruleEvaluator = require('./rule-evaluator.js');
const resultInterpreter = require('./result-interpreter.js');

module.exports = function checkCustomRule(
	ruleDef = {},
	project,
	{console = noopConsole} = {},
) {
	try {
		const matchedNodes = getProjectJsonpathMatches(project, ruleDef)
		const evaluatedNodes = matchedNodes.map(ruleEvaluator(ruleDef,project))
		const allMessages = evaluatedNodes
			.map(resultInterpreter(ruleDef))
			.reduce(flatten,[])
		const exemptMessages = allMessages.filter(m => m.exempt)
		const messages = allMessages.filter(m => m.exempt)
		const summaryMessage = {
			'level': 'info',
			'rule': ruleDef.$name,
			'description': `Rule ${ruleDef.$name} was matched ${matchedNodes.length} time(s), with ${exemptMessages.length} exemptions`,
		};
		return [
			summaryMessage,
			...messages
		];
	} catch (e) {
		console.error(e)
		return {
			level: 'error',
			rule: ruleDef.$name,
			location: `manifest/rule:${ruleDef.$name}`,
			path: `/projects/${project.name}/files/manifest.lkml`,
			...(typeof e == 'object' ? e : {e}),
			description: e && e.message || 'Error in custom rule definition',
		};
	}
}


function flatten(a,b){return a.concat(b)}