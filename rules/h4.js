const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const defaultLabelForField = require('./rules-lib/default-label-for-field.js')

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'H4',
		match: `$.model.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project, options={}) {
	const threshold = !isNaN(options.threshold) ? parseInt(options.threshold) : 30;
	const delimiter = options.delimiter || " > "
	const view = match;

	const messages = []
	const sections = ['dimension', 'measure']
	for(let section of sections){
		const fields = []
			.concat(Object.values(view[section] || {}))
			.concat(Object.values(section==="dimension" && view["dimension_group"] || {}))
			.filter(f => !f.hidden && !f.required_access_grants)

		const topLabels = fields
			.map((field,f) =>
				field.group_label?.split(delimiter)[0]
				|| field.$type === "dimension_group" && defaultLabelForField(field).split(delimiter)[0]
				|| field.$name + "####" + f
				)
			.filter(unique)

		if(topLabels.length <= threshold){continue}

		messages.push(`View has ${topLabels.length} visible top-level ${section} labels (above ${threshold}). Move fields into groups (or move groups into sorting groups using "${delimiter}").`)
	}

	if(messages.length){return messages}
	return true
}

function unique(x,i,arr){return arr.indexOf(x)===i}