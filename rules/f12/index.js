/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const checkCustomRule = require('../../lib/custom-rule/custom-rule.js');

const EXPAND_ALIASES_EXPR = `
	($let rawAliasProp ($get? field "alias"))
	($let rawAliases ($if ($is-array rawAliasProp) rawAliasProp ($if rawAliasProp ($list rawAliasProp) ($list ))))
	($if (=== ($get? field "$type") "dimension_group")
		($if (=== ($get? field "type") "duration")
			($last
				($let fieldIntervals ($get? field "intervals"))
				($let intervals ($if ($all ($is-array fieldIntervals) (> (?? ($get? fieldIntervals "length") 0) 0))
					fieldIntervals
					($list "second" "minute" "hour" "day" "week" "month" "quarter" "year")
				))
				($flatten ($map rawAliases (|-> (a) use (intervals) ($map intervals (|-> (iv) use (a) ($concat iv "s_" a))))))
			)
			($last
				($let fieldTimeframes ($get? field "timeframes"))
				($let timeframes ($if ($all ($is-array fieldTimeframes) (> (?? ($get? fieldTimeframes "length") 0) 0))
					fieldTimeframes
					($list "raw" "time" "date" "week" "month" "quarter" "year")
				))
				($flatten ($map rawAliases (|-> (a) use (timeframes) ($map timeframes (|-> (tf) use (a) ($concat a "_" tf))))))
			)
		)
		rawAliases
	)
`;

module.exports = function(
	project,
) {
	const match = `$.model.*.view.*[dimension,dimension_group,measure,filter,parameter][?(@.alias)]`;
	let rule = {
		$name: 'F12',
		match,
		description: 'Field aliases should not conflict with other aliases or field names.',
		before_all: {
			index_aliases: {
				expr_init: `(# )`,
				match,
				expr_reduce: `
					($let modelName ($get? path 1))
					($let viewName ($get? path 3))
					($let fieldType ($get? path 4))
					($let fieldName ($get? path 5))
					($let owner ($concat fieldType ":" fieldName))
					($let modelMap (?? ($get-in acc modelName) (# )))
					($set-prop acc modelName modelMap)
					($let viewMap (?? ($get-in modelMap viewName) (# )))
					($set-prop modelMap viewName viewMap)
					($let field match)
					($let expandedAliases ($last ${EXPAND_ALIASES_EXPR}))
					($reduce expandedAliases (|-> (m aliasName) use (owner) ($last
						($let existing (?? ($get-in m aliasName) ($list )))
						($push existing owner)
						($set-prop m aliasName existing)
					)) viewMap)
					acc
				`,
			},
		},
		expr_rule: `
			($let modelName ($get? path 1))
			($let viewName ($get? path 3))
			($let fieldType ($get? path 4))
			($let fieldName ($get? path 5))
			($let view ($get-in project "model" modelName "view" viewName))
			($let field match)
			($let expandedAliases ($last ${EXPAND_ALIASES_EXPR}))
			($let fieldTypes ($list "dimension" "measure" "filter" "parameter"))
			($flatten ($map expandedAliases (|-> (aliasName) use (before_all modelName viewName fieldType fieldName view fieldTypes) ($last
				($let aliasOwners ($get-in before_all "index_aliases" modelName viewName aliasName))
				($let errors ($if (> (?? ($get? aliasOwners "length") 0) 1)
					($list ($concat "Alias \\"" aliasName "\\" on " fieldType " \\"" fieldName "\\" conflicts with another alias (" ($join aliasOwners ", ") ") in view \\"" viewName "\\"."))
					($list )
				))
				($let fieldConflicts ($flatten ($map fieldTypes (|-> (ft) use (view aliasName fieldType fieldName viewName)
					($if ($get-in view ft aliasName)
						($list ($concat "Alias \\"" aliasName "\\" on " fieldType " \\"" fieldName "\\" conflicts with existing " ft " \\"" aliasName "\\" in view \\"" viewName "\\"."))
						($list )
					)
				))))
				($let parts ($split aliasName "_"))
				($let dgTimeConflicts ($flatten ($map ($slice 1 parts) (|-> (_ idx) use (parts view aliasName fieldType fieldName viewName) ($last
					($let splitAt (+ idx 1))
					($let candDg ($join ($slice 0 splitAt parts) "_"))
					($let candTf ($join ($slice splitAt parts) "_"))
					($let dg ($get-in view "dimension_group" candDg))
					($if ($all dg (!== ($get? dg "type") "duration"))
						($last
							($let dgTfs ($get? dg "timeframes"))
							($let tfs ($if ($all ($is-array dgTfs) (> (?? ($get? dgTfs "length") 0) 0))
								dgTfs
								($list "raw" "time" "date" "week" "month" "quarter" "year")
							))
							($if ($includes tfs candTf)
								($list ($concat "Alias \\"" aliasName "\\" on " fieldType " \\"" fieldName "\\" conflicts with dimension_group \\"" candDg "\\" timeframe \\"" candTf "\\" in view \\"" viewName "\\"."))
								($list )
							)
						)
						($list )
					)
				)))))
				($let durMatch ($if (> ($get? parts "length") 1)
					($match "^(second|minute|hour|day|week|month|quarter|year)s$" ($get? parts 0))
					null
				))
				($let dgDurConflicts ($if durMatch
					($last
						($let candIv ($get? durMatch 1))
						($let candDg ($join ($slice 1 parts) "_"))
						($let dg ($get-in view "dimension_group" candDg))
						($if ($all dg (=== ($get? dg "type") "duration"))
							($last
								($let dgIvs ($get? dg "intervals"))
								($let ivs ($if ($all ($is-array dgIvs) (> (?? ($get? dgIvs "length") 0) 0))
									dgIvs
									($list "second" "minute" "hour" "day" "week" "month" "quarter" "year")
								))
								($if ($includes ivs candIv)
									($list ($concat "Alias \\"" aliasName "\\" on " fieldType " \\"" fieldName "\\" conflicts with dimension_group \\"" candDg "\\" interval \\"" candIv "\\" in view \\"" viewName "\\"."))
									($list )
								)
							)
							($list )
						)
					)
					($list )
				))
				($flatten ($list errors fieldConflicts dgTimeConflicts dgDurConflicts))
			))))
		`,
	};
	let messages = checkCustomRule(rule, project, {ruleSource: 'internal'});

	return {messages, rule};
};
