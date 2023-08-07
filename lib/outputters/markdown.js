const defaultConsole = console;
const defaultFs = require('node:fs/promises')

/**
 * Output markdown.md, primarily for reporting in native Looker IDE.
 *
 * @param {array}	messages	Array of messages
 * @param {object}	options 	Options
 * @param {boolean}	options.dateOutput Whether to include a timestamp in the output. Including a timestamp may not be desireable when committing the markdown file to your repo as it creates otherwise unneccessary changes.
 * @param {object}	options.console I/O override for console
 * @param {object}	options.fs 		I/O override for fs (filesystem)
 * @return {void}
 */

async function markdown(messages, {
	dateOutput,
	console = defaultConsole,
	fs = defaultFs
	}={}) {
	console.log('Writing issues.md...');
	const asyncTemplates = require('./templating/templates.js');
	const templates = await asyncTemplates;
	const jobURL = process.env && process.env.BUILD_URL || undefined;
	await fs.writeFile('issues.md', templates.issues({
		messages,
		jobURL,
		dateOutput,
	}).replace(/\n\t+/g, '\n'));
	console.log('> issues.md done');
}

module.exports = markdown