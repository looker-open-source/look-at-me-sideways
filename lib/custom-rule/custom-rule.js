
const defaultConsole = console;
const noopConsole = {error: ()=>{}}
const getProjectJsonpathMatches = require('./get-project-jsonpath-matches.js');
const ruleMatchEvaluator = require('./rule-match-evaluator.js');
const resultInterpreter = require('./result-interpreter.js')
const {msg} = require('../message/message.js')
const loc = require('../message/location-template-literal.js')

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
	let matchedNodes, exemptMessages, errorMessages, mainMessages
	try {
		const evaluateRuleMatch = ruleMatchEvaluator(ruleDef, project)
		matchedNodes = getProjectJsonpathMatches(project, ruleDef)
		const evaluatedNodes = matchedNodes.map(evaluateRuleMatch)
		mainMessages = evaluatedNodes
			.map(resultInterpreter(ruleDef))
			.reduce(flatten,[])
	} catch (e) {
		//defaultConsole.error(e?.stack || e) // Can help pinpoint errors in built-in rules
		mainMessages = [msg({
			level: 'error',
			rule: ruleDef.$name,
			location: loc`${ruleSource}/rule:${ruleDef.$name}`,
			path: ruleSource == 'manifest' ? `/projects/${project.name}/files/manifest.lkml` : undefined,
			...(typeof e == 'object' ? e : {e}),
			description: e && e.message || 'Error in custom rule definition',
		})];
	}

	exemptMessages = mainMessages.filter(m => m?.exempt)
	errorMessages = mainMessages.filter(m => m.level == "error")
	const summaryMessage = msg({
			level: 'info',
			rule: ruleDef?.$name,
			description: `Rule ${ruleDef?.$name} summary: ${matchedNodes?.length} matches, ${exemptMessages?.length} matches exempt, and ${errorMessages?.length} errors`,
		});
	return [
		summaryMessage,
		...mainMessages
	]
}


function flatten(a,b){return a.concat(b)}