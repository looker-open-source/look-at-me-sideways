#! /usr/bin/env node
/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const minimist = require('minimist');
const lams = require('./index.js');
const fromEntries = require('fromentries');
const cliArgs = fromEntries( // ponyfill for Object.fromEntries
	Object.entries(
		minimist(
			process.argv.slice(
				process.argv[0] == 'lams'
					? 1 // e.g. lams --bla
					: 2, // e.g. node index.js --bla
			),
			{
				alias: {
					source: ['input', 'i'],
				},
			},
		),
	)
		// Convert kebab-case and snake_case to camelCase
		.map(([k, v])=>[k.replace(/[-_][a-zA-Z-0-9]/g, (s)=>s.slice(1).toUpperCase()), v]),
);

!async function() {
	await lams(cliArgs);
}();
