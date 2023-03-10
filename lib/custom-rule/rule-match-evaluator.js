
const parser = require('./custom-rule-parser.js');
const getExemption = require('../get-exemption.js');
const CodeError = require('../code-error.js');
const deepGet = require('../deep-get.js');

module.exports = function ruleMatchEvaluator(ruleDef={}, project){
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
		try {
			ruleFn = parser.parse(`( -> (match path project) ($last ${ruleDef.expr_rule}))`);
		} catch (e) {
			throw new CodeError(`Invalid expr_rule in manifest/rule:${ruleDef.$name}. ${e.message||''}`, 1);
		}
	}
	return function(match){
		const result = false
			|| shortcircuitExemptMatch(match)
			|| shortcircuitAbstractMatch(match)
			|| evaluateRuleFn(match);
		return result;
	}

	function shortcircuitExemptMatch(match){
		const {path} = match;

		// Check match for being exempt and return early (without evaluating expression) if so
		const {exempt} = path.reduce(
			({modelFragment, exempt}, pathpart)=>({
				exempt: exempt || getExemption(modelFragment[pathpart], ruleDef.$name),
				modelFragment: modelFragment[pathpart],
			}),
			{modelFragment: project},
		);

		if(exempt){
			return {
				match,
				exempt
			}
		}	
	}
	
	function shortcircuitAbstractMatch(match){
		if(ruleDef.matchAbstract === true){
			return
		}
		
		const {path} = match;

		// Check match for being abstract and return early (without evaluating expression) if so and not explicitly opted-in to
		const isAbstractablePath = !!(
			(path[0]==="model")
			&& (path[2]=="view" || path[2]=="explore")
			&& path[3]
		)
		if(isAbstractablePath && path[3][0]==='+'){
			return {
				match,
				value: {
					level: "verbose",
					description: "Matched object is abstract (refinement) and the rule does not opt-in via matchAbstract:yes"
				}	
			}
		}
		const extendableOject = deepGet(project,path.slice(0,4))
		const isAbstract = isAbstractablePath 
			&& extendableOject.extension == "required"
			&& (extendableOject.extends === undefined || extendableOject.extends.length === 0)
		if(isAbstract){
			return {
				match,
				value: {
					level: "verbose",
					description: "Matched object is abstract (extension:required) and the rule does not opt-in via matchAbstract:yes"
				}
			}
		}
	}
	function evaluateRuleFn(match){ 
		const result = {
			match,
			value: ruleFn(match.value, match.path, project)
		};
		return result
		}
}