/* Copyright (c) 2025 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

module.exports = loc

function loc(strings, ...values){
	const escapedVals = values.map(val => val?.toString().replace(/[\\\/:]/g, ch => "\\" + ch))
	return strings[0] + escapedVals.map((val,v) => val + strings[v+1])
}