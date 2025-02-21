
const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const defaultLabelForField = require('./rules-lib/default-label-for-field.js');

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
	const prefix = options.prefix!==undefined ? options.prefix : '[';
	const suffix = options.suffix!==undefined ? options.suffix : ']';
	const view = match;
	const dimensions = Object.values(view?.dimension || {});
	if (dimensions.some((d) => d.$name.match(/^pk0_/))) {
		return {level: 'verbose', description: 'Field hoisting not relevant for 0-PK views'};
	}
	const labels = dimensions
		.filter((f) => !(f.hidden ?? view.fields_hidden_by_default) && !f.required_access_grants)
		.map((dim) => dim.group_label || dim.label || defaultLabelForField(dim));
		// Dimension_groups being for dates, they don't really work as identifiers.
		// Omitting them for now, but may revisit the decision in the future
		// .concat(Object.values(view?.dimension_group || {}).map(dg => dg.label))

	if (labels.some((label)=> {
		let maybePrefix = label.slice(0, prefix.length);
		let maybeSuffix = suffix.length===0 ? '' : label.slice(0-suffix.length);
		return maybePrefix === prefix && maybeSuffix === suffix;
	})) {
		return true;
	}
	return `Hoist identifiers by labeling some dimension/group with \`${prefix}...${suffix}\``;
}
