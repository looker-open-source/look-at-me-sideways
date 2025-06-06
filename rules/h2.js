const checkCustomRule = require('../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'H2',
		match: `$.model.*.view.*`,
		description: 'When there are too many fields, use grouping.',
		ruleFn,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

function ruleFn(match, path, project, options={}) {
	const threshold = !isNaN(options.threshold) ? parseInt(options.threshold) : 20;
	const view = match;

	const messages = [];
	const sections = ['dimension', 'measure'];
	for (let section of sections) {
		const fields = []
			.concat(Object.values(view[section] || {}))
			.concat(Object.values(section==='dimension' && view['dimension_group'] || {}))
			.filter((f) => !(f.hidden ?? view.fields_hidden_by_default) && !f.required_access_grants);
			// Should we also filter out fields that are re-labeled into other view_labels, even though it's against rule F2?

		const hasGroupLabels = fields.some((f)=>f.group_label);

		if (fields.length > threshold && !hasGroupLabels) {
			messages.push(`View has ${fields.length} visible ${section}s (above ${threshold}). Use group_label to organize fields.`);
		}
	}

	if (messages.length) {
		return messages;
	}
	return true;
}
