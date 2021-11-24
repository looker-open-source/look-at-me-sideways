const parser = require('./custom-rule-parser.js');
const getExemption = require('../lib/get-exemption.js');
const jsonpath = require('jsonpath');
const defaultConsole = console;

/**
 * CodeError
 */
class CodeError extends Error {
	/**
	 * Throw custom error.
	 * @param {string} message The error message.
	 * @param {number} code The error code.
	 */
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

module.exports = function customRule(
	ruleDef = {},
	project,
	{console = defaultConsole} = {},
) {
	let messages = [];
	let messageDefault = {level: 'error', rule: ruleDef._rule};
	try {
		if (ruleDef.description) {
			messageDefault.description = ruleDef.description;
		}
		if (!ruleDef.expr_rule) {
			throw new CodeError(`Missing expr_rule in manifest/rule:${ruleDef._rule}`, 1);
		}
		let ruleFn;
		try {
			ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`);
		} catch (e) {
			console.error(e);
			throw new CodeError(`Invalid expr_rule in manifest/rule:${ruleDef._rule}`, 1);
		}
		let matchDef = ruleDef.match || '$';
		let matches;
		try {
			matches = jsonpath.nodes(project, matchDef);
		} catch (e) {
			throw new CodeError(`Invalid jsonpath in manifest/rule:${ruleDef._rule}/match: ${matchDef}`, 1);
		}

		messages.push({
			'level': 'info',
			'rule': ruleDef._rule,
			'description': `Rule ${ruleDef._rule} was matched ${matches.length} time(s)`,
		});

		for (let match of matches) {
			let {exempt} = match.path.slice(1).reduce(
				({modelFragment, exempt}, pathpart)=>({
					exempt: exempt || getExemption(modelFragment, ruleDef._rule),
					modelFragment: modelFragment[pathpart],
				}),
				{modelFragment: project},
			);
			let result = ruleFn(match.value, match.path, project);
			if (result === true) {
				continue;
			}
			if (result === false) {
				messages.push({
					...messageDefault,
					location: formatPath(match.path),
					exempt,
				});
			} else if (typeof result === 'string') {
				messages.push({
					...messageDefault,
					location: formatPath(match.path),
					description: result,
					exempt,
				});
			} else if (result.map) {
				messages = messages.concat(result.map((r)=>({
					...messageDefault,
					...(typeof r === 'object' ? r :{}),
					location: formatPath(match.path),
					description: typeof r === 'string' ? r : r.description || r.toString(),
					exempt,
				})));
			} else {
				messages = messages.concat(result);
			}
		}
		return messages;
	} catch (e) {
		return {
			...messageDefault,
			location: `manifest/rule:${ruleDef._rule}`,
			path: `/projects/${project.name}/files/manifest.lkml`,
			...(typeof e == 'object' ? e : {e}),
			description: e && e.message || 'Error in custom rule definition',
		};
	}
};

/**
 * Throw custom error.
 * @param {Array} pathArray Path array to format.
 * @return {string} The formatted path.
 */
function formatPath(pathArray) {
	return pathArray.slice(1).join('/').replace(
		/(^|\/)(model|file|view|join|explore|datagroup|dimension|measure|filter|parameter)\//g,
		(match) => match.slice(0, -1) + ':',
	);
}
