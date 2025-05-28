
const getExemptionDeep = require('../get-exemption-deep.js');
const locationFromPath = require('../message/location-from-path.js');
const IdentifiedError = require('../identified-error.js');
const {msg} = require('../message/message.js')

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
			location: match.path ?? locationFromPath(match.path)
		}
		const resultRule = // E.g., result may specify a sub-rule, e.g. T2.3
			value?.rule
			|| ruleDef.$name 
		const exempt =  
			result.exempt
			|| resultRule!==ruleDef.$name && getExemptionDeep({match, rule: resultRule}) 
			// || value?.exempt //(would we want to allow rules to exempt this way? I'm unsure...)
		if (exempt) {
			return [msg({
				...resultDefault, 
				exempt: true,
				level: "verbose",
				description: `Exempt result: ${exempt}`
			})]
		}
		if(value === undefined){
			return [msg({
				...resultDefault,
				description: `Unsupported value returned from rule: ${stringify(value)}. expr_rule or ruleFn must return a value.`,
			})];
		}
		if (value === true) {
			return []
		}
		if (value === false) {
			return [msg(resultDefault)];
		}
		if (typeof value === 'string') {
			return [msg({
				...resultDefault,
				description: value
			})];
		}
		if (Array.isArray(value)) {
			return value.flatMap((v)=>interpretResult({...result, value:v}));
		}
		if(value && typeof value === 'object' && (value.level || value.description || value.rule)){
			return [msg({
				...resultDefault,
				...value
			})]
		}
		return [msg({
			...resultDefault,
			description: `Unsupported value returned from rule: ${stringify(value)}`,
		})]
	}
}

function stringify(thing,max=40){
	if(thing===undefined){return "undefined"}
	let str
	try{str = JSON.stringify(thing)}
	catch(e){str = ''+thing}
	return str.length<=max ? str : str.slice(0,max-3)+"..."
}