
const defaultConsole = console;
const noopConsole = {error: ()=>{}}
const getMatches = require('./get-matches.js');
const ruleEvaluator = require('./rule-evaluator.js');
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

module.exports = function getRuleMatches(
	ruleDef = {},
	project,
	{
		console = noopConsole,
		ruleSource = 'manifest'
	} = {},
) {
	try {
		const matchedNodes = getMatches(project, ruleDef)
		const evaluatedNodes = matchedNodes.map(ruleEvaluator(ruleDef,project))
		const messages = evaluatedNodes
			.map(resultInterpreter(ruleDef))
			.reduce(flatten,[])
		const exemptMessages = messages.filter(m => m.exempt)
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