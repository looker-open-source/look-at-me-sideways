
const parser = require('./custom-rule-parser.js');
const getExemptionDeep = require('../get-exemption-deep.js');
const getProjectJsonpathMatches = require('./get-project-jsonpath-matches.js');
const IdentifiedError = require('../identified-error.js');

/**
 * Evaluate all `before_all` blocks defined on a rule once prior to per-match evaluation.
 *
 * @param {object} ruleDef - Rule definition
 * @param {object} project - Parsed LookML project
 * @param {*} options - Rule options from manifest
 * @param {Array} matches - Parent rule's matched nodes (reused if a block uses the same `match`)
 * @return {object|undefined} Map of block name to pre-computed value
 */
function evaluateBeforeAll(ruleDef, project, options, matches) {
	const blocks = ruleDef.before_all;
	if (!blocks || typeof blocks !== 'object') {
		return undefined;
	}
	const rule = ruleDef.$name;
	const result = {};
	for (const [name, block] of Object.entries(blocks)) {
		if (!block || typeof block !== 'object') {
			continue;
		}
		let initFn;
		if (typeof block.initFn === 'function') {
			if (block.expr_init) {
				throw new IdentifiedError(1004, `Rule before_all:${name} may not include both initFn and expr_init in manifest/rule:${rule}`);
			}
			initFn = block.initFn;
		} else if (block.expr_init) {
			try {
				initFn = parser.parse(`( -> (project options) ($last ${block.expr_init}))`);
			} catch (e) {
				throw new IdentifiedError(1005, `Invalid expr_init in before_all:${name} in manifest/rule:${rule}. ${e.message || ''}`);
			}
		}

		let reduceFn;
		if (typeof block.reduceFn === 'function') {
			if (block.expr_reduce) {
				throw new IdentifiedError(1006, `Rule before_all:${name} may not include both reduceFn and expr_reduce in manifest/rule:${rule}`);
			}
			reduceFn = block.reduceFn;
		} else if (block.expr_reduce) {
			try {
				reduceFn = parser.parse(`( -> (acc match path project options) ($last ${block.expr_reduce}))`);
			} catch (e) {
				throw new IdentifiedError(1007, `Invalid expr_reduce in before_all:${name} in manifest/rule:${rule}. ${e.message || ''}`);
			}
		}

		let acc;
		try {
			acc = initFn ? initFn(project, options) : undefined;
		} catch (e) {
			throw new IdentifiedError(1008, `Error evaluating expr_init in before_all:${name} in manifest/rule:${rule}. ${e.message || ''}`);
		}

		if (reduceFn) {
			if (!block.match) {
				throw new IdentifiedError(1009, `Missing \`match\` in before_all:${name} in manifest/rule:${rule}`);
			}
			const blockMatches = (block.match === ruleDef.match && Array.isArray(matches))
				? matches
				: getProjectJsonpathMatches(project, {$name: `${rule}/before_all:${name}`, match: block.match});
			try {
				for (const m of blockMatches) {
					acc = reduceFn(acc, m.value, m.path, project, options);
				}
			} catch (e) {
				throw new IdentifiedError(1010, `Error evaluating expr_reduce in before_all:${name} in manifest/rule:${rule}. ${e.message || ''}`);
			}
		}
		result[name] = acc;
	}
	return result;
}

module.exports = function ruleMatchEvaluator(ruleDef={}, project, {matches} = {}){
	const rule = ruleDef.$name
	const options = project?.manifest?.rule?.[rule]?.options
	const beforeAll = evaluateBeforeAll(ruleDef, project, options, matches);
	let ruleFn;
	if(typeof ruleDef.ruleFn == 'function'){
		if (ruleDef.expr_rule) {
			throw new IdentifiedError(1001,`Rule definition may not include both ruleFn and expr_rule in manifest/rule:${rule}`);
		}
		ruleFn = ruleDef.ruleFn
	}
	else {
		if (!ruleDef.expr_rule) {
			throw new IdentifiedError(1002,`Missing expr_rule in manifest/rule:${rule}`);
		}
		try {
			ruleFn = parser.parse(`( -> (match path project options before_all) ($last ${ruleDef.expr_rule}))`);
		} catch (e) {
			throw new IdentifiedError(1003,`Invalid expr_rule in manifest/rule:${rule}. ${e.message||''}`);
		}
	}
	return function evaluateRuleMatch(match){
		const exempt = getExemptionDeep({match,rule})
		if(exempt){
			return {match,exempt}
		}
		try{
			return {match, value:ruleFn(match.value, match.path, project, options, beforeAll)}
		}
		catch(e){
			return {
				match,
				value: {
					level: 'error',
					rule,
					description: `Error evaluating rule: ${e && e.message}`,
				}
			}
		}
	}
}