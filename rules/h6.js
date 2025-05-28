const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const defaultLabelForField = require('./rules-lib/default-label-for-field.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'H6',
		match: `$.model.*.explore.*`,
		description: "When there are too many views in an explore, use sortable prefixes for joins.",
		ruleFn,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

function ruleFn(match, path, project, options={}) {
	const threshold = !isNaN(options.threshold) ? parseInt(options.threshold) : 20;
	const delimiter = options.delimiter || ' > ';
	const explore = match;
	const model = project.model[path[1]];

	const joins = Object.values(explore.join || {});

	const viewLabels = [explore, ...joins]
		.map((join) =>
			join.view_label
			// If no join.view_label, next is label on the associated view
			|| model?.view?.[join.from || join.$name]?.label
			// If neither, fallback is based on join name
			|| defaultLabelForField(join))
		.filter(Boolean)
		.filter(unique);

	if (viewLabels.length <= threshold) {
		return true;
	}

	const hasSortLabels = viewLabels.some((label) => label.includes(delimiter));
	if (!hasSortLabels) {
		return `Explore has ${viewLabels.length} visible view labels (above ${threshold}). Sort views into categories with a "${delimiter}" delimiter.`;
	}

	const topLabels = viewLabels
		.map((l) => l.split(delimiter)[0])
		.filter(Boolean)
		.filter(unique);
	if (topLabels.length == viewLabels.length) {
		return `Some view labels contain the sorting delimiter ("${delimiter}"), but no groups share the same prefix, so no reduction in user complexity is achieved.`;
	}
	return true;
}

function unique(x, i, arr) {
	return arr.indexOf(x)===i;
}
