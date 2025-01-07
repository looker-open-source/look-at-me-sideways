
const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'H1',
		match: `$.model.*.view.*`,

		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project, options={}) {
	const prefix = options.prefix!==undefined ? options.prefix : "["
	const suffix = options.suffix!==undefined ? options.suffix : "]"
	const view = match;
	const dimNames = Object.keys(view?.dimension || {})
	if(dimNames.some(d => d.match(/^pk0_/))){
		return {level:"verbose",description:"Field hoisting not relevant for 0-PK views"}
	}
	const labels = []
		.concat(Object.values(view?.dimension || {}).map(dim => dim.label))
		.concat(Object.values(view?.dimension || {}).map(dim => dim.group_label))
		// Dimension groups being for dates, they don't really work as identifiers.
		// Omitting them for now, but may revisit the decision in the future
		//.concat(Object.values(view?.dimension_group || {}).map(dg => dg.label))
		.filter(l => typeof l==="string")
	if(labels.some(label=> {
		let maybePrefix = label.slice(0,prefix.length)
		let maybeSuffix = suffix.length===0 ? "" : label.slice(0-suffix.length)
		return maybePrefix === prefix && maybeSuffix === suffix
		})){
		return true
		}
	return `Hoist identifiers by labeling some dimension/group with \`${prefix}...${suffix}\``
}