
const getExemptionDeep = require('../get-exemption-deep.js');
const formatLocation = require('./format-location.js');
const CodeError = require('../code-error.js');

const ifValidLevel = (l) => ["verbose","info","error"].includes(l) && l

module.exports =  function resultInterpreter(ruleDef={}){
	const ruleDefault = {
		rule: ruleDef.$name,
		level: ifValidLevel(ruleDef.level) || "error",
		description: ruleDef.description || ""
	}
	return function interpretResult(result){
		const {match,value} = result
		const resultDefault = {
			...ruleDefault,
			location: formatLocation(match?.path)
		}
		const resultRule = // E.g., result may specify a sub-rule, e.g. T2.3
			value?.rule
			|| ruleDef.$name 
		const exempt =  
			result.exempt
			|| resultRule!==ruleDef.$name && getExemptionDeep({match, rule: resultRule}) 
			// || value?.exempt //(would we want to allow rules to exempt this way? I'm unsure...)
		if (exempt) {
			return [{
				...resultDefault, 
				exempt: true,
				level: "verbose",
				description: `Exempt result: ${exempt}`
			}]
		}
		if(value === undefined){
			return [{
				...resultDefault,
				description: `Unsupported value returned from rule: ${stringify(value)}. expr_rule or ruleFn must return a value.`,
			}];
		}
		if (value === true) {
			return []
		}
		if (value === false) {
			return [resultDefault];
		}
		if (typeof value === 'string') {
			return [{
				...resultDefault,
				description: value
			}];
		}
		if (Array.isArray(value)) {
			return value.flatMap((v)=>interpretResult({...result, value:v}));
		}
		if(value && typeof value === 'object' && (value.level || value.description || value.rule)){
			return [{
				...resultDefault,
				...value
			}]
		}
		return [{
			...resultDefault,
			description: `Unsupported value returned from rule: ${stringify(value)}`,
		}]
	}
}

function stringify(thing,max=40){
	if(thing===undefined){return "undefined"}
	let str
	try{str = JSON.stringify(thing)}
	catch(e){str = ''+thing}
	return str.length<=max ? str : str.slice(0,max-3)+"..."
}