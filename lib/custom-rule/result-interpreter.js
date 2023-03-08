module.exports = 
function resultInterpreter(ruleDef={}){
	let ruleDefault = {
		rule: ruleDef.$name,
		level: "error",
		description: ruleDef.description
	}
	return function interpretResult(result){
			let resultDefault = {
				...ruleDefault,
				level: 'error',
				location: formatPath(result.match.path)
			}
			if (result.exempt) {
				return [{
					...resultDefault, 
					exempt: true,
					level: "verbose",
					description: `Exempt: ${result.exempt}`
				}]
			}
			if(result.value === undefined){
				return [{
					...resultDefault,
					description: `Unsupported value returned from rule: ${stringify(result.value)}. expr_rule or ruleFn must return a value.`,
				}];
			}
			if (result.value === true) {
				return []
			}
			if (result.value === false) {
				return [resultDefault];
			}
			if (typeof result.value === 'string') {
				return [{
					...resultDefault,
					description: result.value
				}];
			}
			if (Array.isArray(result.value)) {
				//TODO: Now that interpretResult is refactored into its own function, should this just be a recursive call rather than a special case?
				return result.value.map((r)=>({
					...resultDefault,
					...(typeof r === 'object' ? r :{}),
					description: typeof r === 'string' ? r : r.description || r.toString(),
				}));
			}
			if(result.value && typeof result.value === 'object' && (result.value.level || result.value.description)){
				return [{
					...resultDefault,
					...result.value
				}]
			}
			return [{
				...resultDefault,
				description: `Unsupported value returned from rule: ${stringify(result.value)}`,
			}]
		}
	}

/**
 * Throw custom error.
 * @param {Array} pathArray Path array to format.
 * @return {string} The formatted path.
 */
function formatPath(pathArray) {
	return pathArray.join('/').replace(
		/(^|\/)(model|file|view|join|explore|datagroup|dimension|measure|filter|parameter)\//g,
		(match) => match.slice(0, -1) + ':',
	);
}

function stringify(thing,max=40){
	if(thing===undefined){return "undefined"}
	let str
	try{str = JSON.stringify(thing)}
	catch(e){str = ''+thing}
	return str.length<=max ? str : str.slice(0,max-3)+"..."
}