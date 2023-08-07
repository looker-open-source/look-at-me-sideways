const defaultConsole = console;
const defaultFs = require('node:fs/promises');
const markdown = require('./markdown.js');


    /**
	 * Output developer.md, which may help developers navigate the project. Available for backwards compatibility, but generally less used.
	 *
	 * @param {array}	messages	Array of messages
	 * @param {object}	options.console I/O override for console
	 * @param {object}	options.fs 		I/O override for fs (filesystem)
	 * @return {void}
	 */
    async function markdownDeveloper(messages, {
		console = defaultConsole,
		fs = defaultFs
		}) {
        console.log('Writing developer.md files...');
        const templates = await require('./templating/templates.js');
        await fs.writeFile('developer.md', templates.developer({messages}).replace(/\n\t+/g, '\n'));
        console.log('> developer.md done');
    }

module.exports = markdownDeveloper
