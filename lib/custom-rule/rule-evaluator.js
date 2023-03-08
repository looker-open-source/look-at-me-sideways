
const parser = require('./custom-rule-parser.js');
const getExemption = require('../get-exemption.js');
const CodeError = require('../code-error.js');

module.exports = function ruleEvaluator(ruleDef={}, project){
<<<<<<< HEAD
	if (!ruleDef.expr_rule) {
		throw new CodeError(`Missing expr_rule in manifest/rule:${ruleDef.$name}`, 1);
	}

	// Determine the ruleFn
	if(typeof ruleDef.ruleFn !== 'function'){
		throw new CodeError(`ruleFn may not be provided, except by LAMS internals as a function. In manifest/rule:${ruleDef.$name}, recevied ${ruleFn.slice(0,20)}...`)
	}
	if(ruleDef.expr_rule && ruleDef.ruleFn){
		throw new CodeError(`A rule may not provide both an expr_rule and a ruleFn. Received both in manifest/rule:${ruleDef.$name}`)
	}
	let ruleFn;
	if(ruleDef.ruleFn){
		ruleFn = ruleDef.ruleFn;
	}
	else{
=======
	let ruleFn;
	if(typeof ruleDef.ruleFn == 'function'){
		if (ruleDef.expr_rule) {
			throw new CodeError(`Rule definition may not include both ruleFn and expr_rule in manifest/rule:${ruleDef.$name}`, 1);
		}
		ruleFn = ruleDef.ruleFn
	}
	else {
		if (!ruleDef.expr_rule) {
			throw new CodeError(`Missing expr_rule in manifest/rule:${ruleDef.$name}`, 1);
		}
>>>>>>> v3
		try {
			ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`);
		} catch (e) {
			throw new CodeError(`Invalid expr_rule in manifest/rule:${ruleDef.$name}. ${e.message||''}`, 1);
		}
	}
	return function evaluateRule(match){ 
		let {exempt} = match.path.slice(1).reduce(
			({modelFragment, exempt}, pathpart)=>({
				exempt: exempt || getExemption(modelFragment, ruleDef.$name),
				modelFragment: modelFragment[pathpart],
			}),
			{modelFragment: project},
		);
		if(exempt){
			return {
				match,
				exempt:true
			}
		}
		let result = {
			value: ruleFn(match.value, match.path, project),
			match
		};
		return result
		}
}