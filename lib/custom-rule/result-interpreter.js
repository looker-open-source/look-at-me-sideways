module.exports = 
function resultInterpreter(ruleDef={}, project){
	let ruleDefault = {
		rule: ruleDef.$name,
		description: ruleDef.description
	}
	return function interpretResult(result){
			let resultDefault = {
				...ruleDefault,
				level: 'error',
				location: formatPath(result.match.path),
				exempt: result.exempt,
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
				description: `Unsupported value returned from rule: ${(''+match.value).slice(12)}`,
				exempt: false // Exemption within the project should not silence rule-related errors
			}]
		}
	}

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