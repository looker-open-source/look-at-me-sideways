
const parser = require('./custom-rule-parser.js');
const getExemption = require('../get-exemption.js');
const CodeError = require('../code-error.js');

module.exports = function ruleEvaluator(ruleDef={}, project){
	if (!ruleDef.expr_rule) {
		throw new CodeError(`Missing expr_rule in manifest/rule:${ruleDef.$name}`, 1);
	}
	let ruleFn;
	try {
		ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`);
	} catch (e) {
		throw new CodeError(`Invalid expr_rule in manifest/rule:${ruleDef.$name}. ${e.message||''}`, 1);
	}
	return function evaluateRule(match){ 
		let {exempt} = match.path.slice(1).reduce(
			({modelFragment, exempt}, pathpart)=>({
				exempt: exempt || getExemption(modelFragment, ruleDef.$name),
				modelFragment: modelFragment[pathpart],
			}),
			{modelFragment: project},
		);
		let result = {
			value: ruleFn(match.value, match.path, project),
			exempt,
			match
		};
		return result
		}
}