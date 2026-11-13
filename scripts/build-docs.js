/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rulesDir = path.join(rootDir, 'rules');
const outputPath = path.join(rootDir, 'docs', 'rules.html');

const categories = JSON.parse(
	fs.readFileSync(path.join(rulesDir, 'categories.json'), 'utf8'),
).sort((a, b) => a.order - b.order);

const rules = fs.readdirSync(rulesDir, {withFileTypes: true})
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => {
		const metaPath = path.join(rulesDir, dirent.name, 'meta.json');
		const readmePath = path.join(rulesDir, dirent.name, 'README.md');
		if (!fs.existsSync(metaPath) || !fs.existsSync(readmePath)) {
			return null;
		}
		const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
		const body = fs.readFileSync(readmePath, 'utf8').trim();
		return {...meta, body};
	})
	.filter(Boolean);

const rulesByCategory = {};
for (const rule of rules) {
	rulesByCategory[rule.category] = rulesByCategory[rule.category] || [];
	rulesByCategory[rule.category].push(rule);
}
for (const catRules of Object.values(rulesByCategory)) {
	catRules.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id));
}

/**
 * Render simple inline Markdown if the text is not already an HTML block.
 * Preserves raw HTML blocks (<p>, <code>, <details>, <ul>, <img>, etc.).
 * @param {string} markdown
 * @return {string}
 */
function renderMarkdownBlocks(markdown) {
	if (!markdown) return '';
	const blocks = markdown.split(/\n{2,}/);
	return blocks.map((block) => {
		const trimmed = block.trim();
		if (!trimmed) return '';
		if (/^<[a-zA-Z]/.test(trimmed)) {
			return trimmed;
		}
		const inline = trimmed
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
		return `<p>${inline}</p>`;
	}).filter(Boolean).join('\n\n');
}

const navItems = [
	...categories.map((cat) => `<li> <a href="#${cat.id}">${cat.title}</a></li>`),
	'<li> <a href="#linter-errors">Linter Errors</a></li>',
	'<li> <a href="#deprecated-rules">Deprecated Rules</a></li>',
	'<li> <a href="#glossary">Glossary</a></li>',
].join('\n');

const categorySections = categories.map((cat) => {
	const catRules = rulesByCategory[cat.id] || [];
	const rulesHtml = catRules.map((rule) => {
		const bodyHtml = renderMarkdownBlocks(rule.body)
			.split('\n')
			.map((line) => line ? `\t${line}` : '')
			.join('\n');
		return `<details id="${rule.id}">
\t<summary><b><a href="#${rule.id}">${rule.id.toUpperCase()}.</a></b> ${rule.summary}</summary>
${bodyHtml}
\t</details>`;
	}).join('\n');

	return `<h1 id="${cat.id}">${cat.title}</h1>
${cat.intro ? cat.intro + '\n' : ''}${rulesHtml}`;
}).join('\n\n');

const html = `<!doctype html>
<!-- Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt -->
<html>
<head>
\t<title>LAMS Style Guide</title>
\t<meta charset="utf8" />
\t<meta name="viewport" content="width=device-width, initial-scale=1.0">
\t<link rel="shortcut icon" type="image/png" href="img/logo.png"/>
</head>
<body>
<style>
\thtml {width:100%}
\tbody {background-color: #FAFAFA; margin: 2em auto; width: 90%; max-width: 600px;}
\tp,ul {line-height: 1.35;}
\tli{margin-bottom: 0.5em;}
\tdetails {padding-left:3em; margin: 7.5px 0;}
\tsummary {margin-left:-3em; cursor: pointer}
\ta {color:#44B;}
\ta.subtle {color:#559; text-decoration: none;}
\tcode{background-color: #EEF; color:#333;}
\tcode.block {display:block; white-space: pre-wrap; max-width:90%;margin:1em 0 1.5em 0; tab-size:2em;box-shadow: 2px 2px 10px 0px #99C;}
\tcode.good.block {background-color: #EFE; box-shadow: 2px 2px 10px 0px #9C9;}
\tcode.good.block::before {content:"# GOOD:"}
\tcode.good.block.sql::before {content:"-- GOOD:"}
\tcode.questionable.block {background-color: #FFE; box-shadow: 2px 2px 10px 0px #CC9;}
\tcode.questionable.block::before {content:"# QUESTIONABLE:"}
\tcode.questionable.block.sql::before {content:"-- QUESTIONABLE:"}
\tcode.bad.block{background-color: #FEE; box-shadow: 2px 2px 10px 0px #C99;}
\tcode.bad.block::before {content:"# BAD:"}
\tcode.bad.block.sql::before {content:"-- BAD:"}
</style>
<p style="font-size: 0.8em"><a href="https://github.com/looker-open-source/look-at-me-sideways">Look At Me Sideways</a> > </p>
<h1>LAMS Style Guide</h1>
<p>This is a style guide for <a href="https://www.looker.com/">Looker</a>'s LookML data modeling language. This style guide, as well as the associated <a href="https://github.com/looker-open-source/look-at-me-sideways">linter, Look At Me Sideways (LAMS)</a>, are designed to help make your LookML project more maintainable.</p>
<p>These rules are opinionated, and might imply significant changes to a LookML project that has been developed organically. We've tried to provide rationales throughout so you can come to your own conclusions. However, at their core, these rules are about making your LookML and SQL reusable, self-explanatory, and reliable.</p>

<nav><ul>
${navItems}
</ul></nav>

${categorySections}

<h1 id="linter-errors">Linter Errors</h1>
<p>In some circumstances, the linter may run into errors while running that are recoverable, and may report them along with its rule findings.</p>
<ul>
\t<li><a href="#P0" id="p0" name="p0">P0.</a> Generic Parser Error - Any parser error other than a LookML syntax error. If visible in the chosen output format, the message's \`location\` property contains the path to the file.</li>
\t<li><a href="#P1" id="p1" name="p1">P1.</a> LookML Syntax Error - The LookML file contains a unexpected syntax (after expenading any \`#LAMS\` conditional comments). If visible in the chosen output format, the message's \`location\` property contains the path to the file and a \`hint\` for expected syntax from the parser.</li>
\t<li><a href="#lams1" id="lams1" name="lams1">LAMS1.</a> Unhandled Rule Error - An execution error occurred while running a rule. Please <a href="https://github.com/looker-open-source/look-at-me-sideways/issues/new?template=Blank+issue">submit a ticket</a> about this.</li>
\t<li><a href="#lams2" id="lams2" name="lams2">LAMS2.</a> Legacy Custom Rule Error - An execution error occured while running a Javascript-based (Deprecated) custom rule</li>
\t<li><a href="#lams3" id="lams3" name="lams3">LAMS3.</a> Error loading JSON data from an individual line of lams-exemptions.ndjson</li>
\t<li><a href="#lams4" id="lams4" name="lams4">LAMS4.</a> Error or info/warning in overall loading of exemptions from lams-exemptions.ndjson</li>
\t<li><a href="#lams5" id="lams5" name="lams5">LAMS5.</a> Error or info/warning in the loading of manifest values</li>
</ul>
<h1 id="deprecated-rules">Deprecated Rules</h1>
<ul>
\t<li><a href="#f7" id="f7" name="f7">F7</a> previously recommended proactively exposing "summary" measures for your dimensions. While summary measures can still be useful for select dimensions, the release of custom measures which explore users can automatically generate from a dimension in the Explore UI renders this practice no longer as important.</li>
\t<li><a href="#k2" id="k2" name="k2">K2</a> is a deprecated identifier for rule details that are now included under K1.</li>
</ul>
<h1 id="glossary">Glossary</h1>
<ul>
\t<li id="glossary-dist-key">Distribution key - In Redshift, Vertica, MemSQL, MS PDW and possibly some others, data can be distributed according to a particular value. For simplicity, I use the name distribution key, though different dialects may have different names for this.</li>
\t<li id="glossary-sort-key">Sort/cluster key - Sort keys in Redshift, or partition & cluster columns in Big Query, clustered indexes in MS SQL Server or PDW, etc.</li>
\t<li>View - The style guide deals exclusively with LookML Views. That is, database views are not in scope.</li>
</ul>
</body></html>
`;

fs.writeFileSync(outputPath, html);
console.log(`Built ${outputPath} with ${rules.length} rules across ${categories.length} categories.`);
