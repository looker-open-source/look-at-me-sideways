/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');
const loc = require('../../lib/message/location-template-literal.js');

const CODE_TO_RULE = {
	PARSE_ERROR: 'P0',
	SYNTAX_ERROR: 'P1',
	DUPLICATE_SINGULAR_PROPERTY: 'P2',
	INVALID_PROPERTY_TYPE: 'P3',
	MISSING_REQUIRED_PROPERTY: 'P4',
};

const DEFAULT_ENABLED_RULES = new Set(['P0', 'P1']);

module.exports = function(
	project,
	ruleConfig = {},
) {
	let rule = {
		$name: 'P',
		match: `$.errors.*`,
		description: 'LookML files should parse without parser or schema validation errors.',
		ruleFn: (match) => ruleFn(match, project, ruleConfig),
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};

function ruleFn(match, project, ruleConfig) {
	const e = match;
	const exception = e && (e.exception || e.error && e.error.exception) || {};
	const filePath = e && (e.filePath || e.$file_path);
	const context = e && e.context || exception.context;
	const code = e && e.code || (exception.name === 'SyntaxError' ? 'SYNTAX_ERROR' : 'PARSE_ERROR');
	const ruleId = CODE_TO_RULE[code] || 'P0';

	const manifestRules = project && project.manifest && project.manifest.rule || {};
	const subRuleConfig = manifestRules[ruleId];
	const enabled = subRuleConfig
		? subRuleConfig.enabled !== false
		: ruleConfig._defaultOnly
			? DEFAULT_ENABLED_RULES.has(ruleId)
			: true;
	if (!enabled) {
		return true;
	}

	return {
		rule: ruleId,
		location: loc`file:${filePath}`,
		level: 'error',
		description: `Parsing error: ${e && e.message || exception.message || e}`,
		path: filePath,
		...(context ? {hint: context} : {}),
	};
}
