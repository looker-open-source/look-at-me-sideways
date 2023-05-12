/* Copyright (c)  Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const checkCustomRule = require('../lib/custom-rule/custom-rule.js');
const deepGet = require('../lib/deep-get.js');

module.exports = function(
	project,
) {
	let ruleDef = {
		$name: 'W1',
		match: `$.file..`,
		ruleFn,
	};
	let messages = checkCustomRule(ruleDef, project, {ruleSource: 'internal'});

	return {messages};
};

function ruleFn(match, path, project) {
	let object = match;
	if (!object || typeof object !== 'object') {
		return true;
	}
	if (!object.$strings) {
		// This is a parser-generated collection (e.g. $.model)
		return true;
	}

	let {targetIndentation} = path.reduce(
		({fragment, targetIndentation, pathCheck}, pathPart) => ({
			fragment: fragment[pathPart],
			targetIndentation: targetIndentation + (fragment[pathPart].$strings ? 1 : 0),
			// pathCheck: pathCheck +"/"+pathPart + (fragment[pathPart].$strings ? "+1" : "")
		}), {
			fragment: project,
			targetIndentation: -1,
			// pathCheck:""
		},
	);
	if (path[2]==='model') {
		// Because the .model.lkml filetype has nuilt-in meaning, the parser inserts a transparent model object at its root that shouldn't cause indenting
		targetIndentation-=1;
	}
	const lines = object.$strings
		.map((str) =>
			!str ? ''
				: Array.isArray(str) ? '@'+str[0]
					: str)
		.map((str) =>
			['@$type', '@$name'].includes(str)
			&& deepGet(project, [...path, str.slice(1)])
			|| str)
		.join('')
		.split('\n');

	// let lines = [], currentLine = ""
	// for(let str of object.$strings){
	// 	if(Array.isArray(str)){
	// 		currentLine += "@"+str[0];
	// 		continue
	// 	}
	// 	let innerLines = str.split(/\n[^\n]*/g)
	// 	currentLine+=innerLines[0]

	// 	if(!newLines){

	// 		}
	// 		currentLine &
	// 		lines.push(...newLines.slice(0,-1))
	// 		currentLine = newLines.slice(-1)[0]
	// 		}
	// 	else {
	// 		currentLine+
	// 		}
	// }

	const problemLines = lines
		.filter((line, l) => l>0 || targetIndentation==0)
		.map((line, l)=> ({
			line, l,
			actual: countIndentsOrLeadingCloses(line),
		}))
		.map((o) => ({...o,
			specialCase:
				o.l === 0 && o.actual === 0 ? 'F' // First line of a deep object is always 0 because external whitespace including indentation is in the parent object
					: o.line === '' ? 'E' // Empty lines are fine
						: o.line[0] === '#' ? 'C' // Lines immediately starting in a comment are fine
							: path[2]==='model' && path.length === 4 && o.line === '}' ? 'M' // Trailing close of simulated model object
								: false,
		}))
		.filter((o)=> o.actual !== targetIndentation && !o.specialCase)
		.map((o) =>
			`Expected inner indentation level: ${targetIndentation}, found ${o.specialCase || o.actual}: `
			+(o.specialCase || o.actual === targetIndentation ? 'ok' : '❌')
			+ o.line.replace(/\n/g, '⏎').replace(/ /g, '•').replace(/\t/g, '→ ').slice(0, 30),
		);

	return problemLines;
}

function countIndentsOrLeadingCloses(line) {
	return line.replace(/ {2}/g, '\t').match(/^\t*}*/)[0].length;
}
