
const defaultConsole = console;
const noopConsole = {error: ()=>{}}
const getProjectJsonpathMatches = require('./get-project-jsonpath-matches.js');
const ruleMatchEvaluator = require('./rule-match-evaluator.js');
const resultInterpreter = require('./result-interpreter.js');

/**
 * Custom Rule Runner. Accepts a custom rule definition and a project, and returns associated messages
 *
 * @param {object}	ruleDef - Custom rule definition
 * @param {object}	project - LookML project or project fragment
 * @param {object}	options - Options
 * @param {string=}	options.console - Console object to use for any logging
 * @return Messages array
 */

module.exports = function checkCustomRule(
	ruleDef = {},
	project,
	{
		console = noopConsole,
		ruleSource = 'manifest'
	} = {},
) {
	try {
		const evaluateRuleMatch = ruleMatchEvaluator(ruleDef, project)
		const matchedNodes = getProjectJsonpathMatches(project, ruleDef)
		const evaluatedNodes = matchedNodes.map(evaluateRuleMatch)
		
		const allMessages = evaluatedNodes
			.map(resultInterpreter(ruleDef))
			.reduce(flatten,[])
		const exemptMessages = allMessages.filter(m => m.exempt)
		const errorMessages = allMessages.filter(m => m.level == "error")
		const summaryMessage = {
			'level': 'info',
			'rule': ruleDef.$name,
			'description': `Rule ${ruleDef.$name} summary: ${matchedNodes.length} matches, ${exemptMessages.length} matches exempt, and ${errorMessages.length} errors`,
		};
		return [
			summaryMessage,
			...allMessages
		];
	} catch (e) {
		//defaultConsole.error(e?.stack || e) // Can help pinpoint errors in built-in rules
		return [{
			level: 'error',
			rule: ruleDef.$name,
			location: `${ruleSource}/rule:${ruleDef.$name}`,
			path: ruleSource == 'manifest' ? `/projects/${project.name}/files/manifest.lkml` : undefined,
			...(typeof e == 'object' ? e : {e}),
			description: e && e.message || 'Error in custom rule definition',
		}];
	}
}


function flatten(a,b){return a.concat(b)}