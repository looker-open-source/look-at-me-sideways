
const parser = require('./custom-rule-parser.js');
const getExemptionDeep = require('../get-exemption-deep.js');
const CodeError = require('../code-error.js');
const deepGet = require('../deep-get.js');

module.exports = function ruleMatchEvaluator(ruleDef={}, project){
	const rule = ruleDef.$name
	const options = project?.manifest?.rule?.[rule]?.options
	let ruleFn;
	if(typeof ruleDef.ruleFn == 'function'){
		if (ruleDef.expr_rule) {
			throw new CodeError(`Rule definition may not include both ruleFn and expr_rule in manifest/rule:${rule}`, 1);
		}
		ruleFn = ruleDef.ruleFn
	}
	else {
		if (!ruleDef.expr_rule) {
			throw new CodeError(`Missing expr_rule in manifest/rule:${rule}`, 1);
		}
		try {
			ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`);
		} catch (e) {
			throw new CodeError(`Invalid expr_rule in manifest/rule:${rule}. ${e.message||''}`, 1);
		}
	}
	return function evaluateRuleMatch(match){
		const exempt = getExemptionDeep({match,rule})
		if(exempt){
			return {match,exempt}
		}
		try{
			return {match, value:ruleFn(match.value, match.path, project, options)}
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