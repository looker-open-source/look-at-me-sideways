const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'H2',
		match: `$.model.*.view.*`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project, options={}) {
	const threshold = !isNaN(options.threshold) ? parseInt(options.threshold) : 20;
	const view = match;

	const messages = []
	const sections = ['dimension', 'measure']
	for(let section of sections){
		const fields = []
			.concat(Object.values(view[section] || {}))
			.concat(Object.values(section==="dimension" && view["dimension_group"] || {}))
			.filter(f => !f.hidden && !f.required_access_grants)
	
		const hasGroupLabels = fields.some(f=>f.group_label)

		if(fields.length > threshold && !hasGroupLabels){
			messages.push(`View has ${fields.length} visible ${section}s (above ${threshold}). Use group_label to organize fields.`)
		}
	}

	if(messages.length){return messages}
	return true
}