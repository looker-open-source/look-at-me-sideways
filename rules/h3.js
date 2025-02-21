const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const defaultLabelForField = require('./rules-lib/default-label-for-field.js')

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'H3',
		match: `$.model.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project, options={}) {
	const threshold = !isNaN(options.threshold) ? parseInt(options.threshold) : 10;
	const delimiter = options.delimiter || " > "
	const view = match;

	const messages = []
	const sections = ['dimension', 'measure']
	for(let section of sections){
		const fields = []
			.concat(Object.values(view[section] || {}))
			.concat(Object.values(section==="dimension" && view["dimension_group"] || {}))
			.filter(f => !(f.hidden ?? view.fields_hidden_by_default) && !f.required_access_grants)
			// Should we also filter out fields that are re-labeled into other view_labels, even though it's against rule F2?

		const groupLabels = fields
			.map(f => f.group_label || f.$type === "dimension_group" && defaultLabelForField(f))
			.filter(Boolean)
			.filter(unique)

		if(groupLabels.length <= threshold){continue}

		const hasGroupSortLabels = groupLabels.some(label => label.includes(delimiter))

		if(!hasGroupSortLabels){
			messages.push(`View has ${groupLabels.length} visible ${section} groups (above ${threshold}). Sort groups into categories with a "${delimiter}" delimiter.`)
			continue
		}
		
		const superGroupedLabels = groupLabels
			.map(label => label.split(delimiter)[0])
			.filter(unique)

		if(superGroupedLabels.length === groupLabels.length){
			messages.push(`Some group labels contain the sorting delimiter ("${delimiter}"), but no groups share the same prefix, so no reduction in user complexity is achieved.`)
			continue
		}
	}

	if(messages.length){return messages}
	return true
}

function unique(x,i,arr){return arr.indexOf(x)===i}