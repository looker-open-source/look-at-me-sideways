#! /usr/bin/env node
/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const defaultConsole = console;
const defaultProcess = process;
/**
 * LAMS main function
 *
 * @param {object}	options - options
 * @param {object}	options.cwd - Override the current working directory
 * @param {string=}	options.reporting - One of yes, no, save-yes, or save-no. Program terminates with a warning if omitted. See PRIVACY.md for details
 * @param {string=}	options.reportLicenseKey - Optional Looker License Key. See PRIVACY.md for details
 * @param {string=}	options.onParserError - Set to "fail" to indicate that LookML parsing errors should fail the linter. By default, parsing errors are logged and ignored.
 * @param {string=}	options.reportUser - Optional user email address. See PRIVACY.md for details
 * @param {string=}	options.source - An optional glob specifying which files to read
 * @param {string=}	options.projectName - An optional name for the project, used to generate links back to the project in mardown output
 * @param {*=}		options.allowCustomRules - Experimental option. DO NOT USE TO RUN UNTRUSTED CODE. Pass a value to allow running of externally defined JS for custom rules
 * @param {*=}		options.jenkins - Set to indicate that LAMS is being run by Jenkins and to include the build URL from ENV variables in the markdown output
 * @param {object=} io - IO overrides, primarily for testing
 * @param {object=} io.console
 * @param {object=} io.console.log
 * @param {object=} io.console.warn
 * @param {object=} io.console.error
 * @param {object=} io.fs
 * @param {object=} io.tracker Object compatible with ./lib/tracking.js
 * @param {object=} io.process Object with cwd() and exit()
 * @param {function=} io.get function that takes a URL and returns the contents
 * @return Returns undefined or calls process.exit
 */

module.exports = async function(
	options,
	{
		console = defaultConsole,
		process = defaultProcess,
		fs,
		get,
		tracker,
	} = {}
) {
	let messages = [];		// These are for the LookML developer who has attempted to lint a project
	let lamsMessages = [];	// These are for the administrator who has invoked LAMS
	try {
		fs = fs || require('fs');
		get = get || require('./lib/https-get.js');
		tracker = tracker || require('./lib/tracking')({
			cliArgs: {
				reporting: options.reporting,
				reportLicenseKey: options.reportLicenseKey,
				reportUser: options.reportUser,
			},
			gaPropertyId: 'UA-96247573-2',
		});
		const path = require('path');
		const parser = require('lookml-parser');
		const templates = require('./lib/templates.js');
		const checkCustomRule = require('./lib/custom-rules.js');

		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: options.source,
			conditionalCommentString: 'LAMS',
			fileOutput: 'array',
			cwd: options.cwd || process.cwd(),
			console: {
				log: (msg) => { },
				warn: (msg) => lamsMessages.push({message: msg && msg.message || msg, level: 'lams-warning'}), // LAMS warnings should not abort the deploy
				error: (msg) => lamsMessages.push({message: msg && msg.message || msg, level: 'lams-error'}), // LAMS errors should abort the deploy
			},
		});
		if (project.errors) {
			console.log(project.errors);
			lamsMessages = lamsMessages.concat(project.errors.map((e) =>
				({message: e && e.message || e, level: 'lams-error'})
			));
			if (options.onParserError === 'fail') {
				const parserErrorMessage = 'The LookML Parser is unable to parse this file.';
				messages = messages.concat(project.errors.map((e) =>
					({
							rule: 'LookML Parser Error',
							description: parserErrorMessage,
							path: e._file_path,
							location: e._file_rel,
							message: e && e.message || e,
							level: 'error',
						}
					)
				));
			};
			console.error('> Issues occurred during parsing (containing files will not be considered):');
			project.errorReport();
		}
		if (project.error) {
			throw (project.error);
		}
		project.name = false
			|| project.manifest && project.manifest.project_name
			|| options.projectName
			|| (options.cwd || process.cwd() || '').split(path.sep).filter(Boolean).slice(-1)[0]	// The current directory. May not actually be the project name...
			|| 'unknown_project';
		if (project.name === 'look-at-me-sideways') {
			lamsMessages.push({level: 'lams-warning', message: 'Consider adding a manifest.lkml file to your project to identify the project_name'});
		}
		console.log('> Parsing done!');

		console.log('Checking rules... ');
		let rules = fs.readdirSync(path.join(__dirname, 'rules')).map((fileName) => fileName.match(/^(.*)\.js$/)).filter(Boolean).map((match) => match[1]);
		for (let r of rules) {
			console.log('> ' + r.toUpperCase());
			let rule = require('./rules/' + r + '.js');
			let result = rule(project);
			messages = messages.concat(result.messages.map((msg) => ({rule: r, ...msg})));
		}
		console.log('> Rules done!');

		if (project.manifest && project.manifest.custom_rules) {
			console.warn('\x1b[33m%s\x1b[0m', 'Legacy (Javascript) custom rules may be removed in a future major version!');
			console.log('Checking legacy custom rules...');
			let get = options.get || require('./lib/https-get.js');
			if (options.allowCustomRules !== undefined) {
				let requireFromString = require('require-from-string');
				let customRuleRequests = [];
				project.manifest.custom_rules.forEach(async (url, u) => {
					try {
						let request = get(url);
						customRuleRequests.push(request);
						let ruleSrc = await request;
						console.log('> #' + u);
						let rule = requireFromString(ruleSrc, {
							prependPaths: path.resolve(__dirname, './rules'),
						});
						let result = rule(project);
						messages = messages.concat(result.messages.map((msg) => ({rule: `Custom Rule ${u}`, ...msg})));
					} catch (e) {
						let msg = `URL #${u}: ${e && e.message || e}`;
						console.error('> ' + msg);
						lamsMessages.push({
							level: 'lams-error',
							message: `An error occurred while checking custom rule in ${msg}`,
						});
					}
				});
				await Promise.all(customRuleRequests).catch(() => { });
				console.log('> Legacy custom rules done!');
			} else {
				console.warn([
					'> Your project specifies custom rules. Run LAMS with `--allow-custom-rules`',
					'if you want to allow local execution of this remotely-defined Javascript code:',
				].concat(project.manifest.custom_rules).join('\n  '));
			}
		}

		if (project.manifest && project.manifest.rule) {
			console.log('Checking custom rules...');
			for (let rule of Object.values(project.manifest.rule)) {
				console.log('> ' + rule._rule);
				messages = messages.concat(checkCustomRule(rule, project));
			}
			console.log('> Custom rules done!');
		}
		let errors = messages.filter((msg) => {
			return msg.level === 'error' && !msg.exempt;
		});
		let warnings = messages.filter((msg) => {
			return msg.level === 'warning' && !msg.exempt;
		});
		let lamsErrors = messages.filter((msg) => {
			return msg.level === 'lams-errors' && !msg.exempt;
		});

		const buildStatus = (errors.length || warnings.length || lamsErrors.length) ? 'FAILED' : 'PASSED';
		console.log(`BUILD ${buildStatus}: ${errors.length} errors and ${warnings.length} warnings found. Check .md files for details.`);

		if (options.outputToCli) {
			if (errors.length) {
				console.log('Errors:');
				console.log(errors);
			}
			if (warnings.length) {
				console.log('Warnings:');
				console.log(warnings);
			}
			if (lamsErrors.length) {
				console.log('LAMS Errors:');
				console.log(lamsErrors);
			}
		}

		let jobURL;
		if (options.jenkins) {
			try {
				jobURL = process.env.BUILD_URL;
			} catch (e) {
				// silent
			}
			let json = JSON.stringify({
				buildStatus: buildStatus,
				errors: errors.length,
				warnings: warnings.length,
				lamsErrors: lamsErrors.length,
			});
			fs.writeFileSync('results.json', json, 'utf8');
		}

		console.log('Writing summary files...');
		fs.writeFileSync('developer.md', templates.developer({messages}).replace(/\n\t+/g, '\n'));
		console.log('> Developer index done');
		fs.writeFileSync('issues.md', templates.issues({messages, jobURL}).replace(/\n\t+/g, '\n'));
		console.log('> Issue summary done');

		console.log('> Summary files done!');
		if (tracker.enabled) {
			await Promise.race([
				tracker.track({messages, errors: lamsMessages}),
				new Promise((res) => setTimeout(res, 2000)),
			]);
		}

		if (errors.length) {
			process.exit(1);
		}

		return messages;
	} catch (e) {
		try {
			console.error(e);
			if (!tracker.valid) {
				throw new Error('Unknown error');
			}
			if (tracker.enabled) {
				e.isFatalError = true;
				tracker.track({messages, errors: lamsMessages.concat(e)});
			} else {
				console.warn(`Error reporting is disabled. Run with --reporting=yes to report, or see PRIVACY.md for more info`);
			}
		} catch (e) {
			console.error(e);
			console.error(`Error reporting is not available	. Please submit an issue to https://github.com/looker-open-source/look-at-me-sideways/issues`);
		}
		process.exit(1);
	}
};
