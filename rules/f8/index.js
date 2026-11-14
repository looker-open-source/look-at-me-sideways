/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

module.exports = function(
	project,
) {
	let rule = {
		$name: 'F8',
		match: `$.model.*.view.*[dimension,measure,filter,parameter].*`,
		description: 'Numeric fields of type `number` that appear to be IDs or USD currency should specify `value_format_name`.',
		expr_rule: `
			($let text ($concat (?? ::match:$name "") " " (?? ::match:label "") " " (?? ::match:description "")))
			($if ($any
				($is-hidden path)
				(!== ::match:type "number")
				($boolean ::match:value_format_name)
				($boolean ::match:value_format)
			)
				true
				($if ($any
					(=== ::match:primary_key true)
					($boolean ($match "(^|[^a-zA-Z0-9])(id|ids|identifier)([^a-zA-Z0-9]|$)" "i" text))
				)
					($concat "Field \`" ::match:$name "\` is type:number and appears to be an ID; consider setting \`value_format_name: id\`")
					($if ($boolean ($match "(^|[^a-zA-Z0-9])(usd|us_dollars?|dollars?)([^a-zA-Z0-9]|$)|\\\\$" "i" text))
						($concat "Field \`" ::match:$name "\` is type:number and appears to be USD; consider setting \`value_format_name: usd\` or \`usd_0\`")
						true
					)
				)
			)`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
