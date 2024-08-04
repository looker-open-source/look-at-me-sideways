#! /usr/bin/env node
/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const defaultConsole = console;
const defaultProcess = process;
/**
 * LAMS main function
 *
 * @param {object}	options - options
 * @param {string=}	options.reporting - One of yes, no, save-yes, or save-no. Program terminates with a warning if omitted. See PRIVACY.md for details
 * @param {string=}	options.reportUser - Optional user email address. See PRIVACY.md for details
 * @param {string=}	options.reportLicenseKey - Optional Looker License Key. See PRIVACY.md for details
 * @param {string=}	options.output - Comma-separated string of output modes from among: lines (default), markdown, markdown-developer, jenkins, legacy-cli
 * @param {string=}	options.source - An optional glob specifying which files to read
 * @param {string=}	options.ignore - An optional glob specifying patterns to ignore. Defaults to `node_modules/**`
 * @param {object}	options.cwd - Override the current working directory
 * @param {string=}	options.projectName - An optional name for the project, if not specified in the manifest, used to generate links back to the project in mardown output
 * @param {string=}	options.manifest - An override/alternative for the contents of the manifest file
 * @param {string=}	options.onParserError -  Set to "info" to indicate that LookML parsing errors should not fail the linter
 * @param {boolean} options.verbose Set to also output verbose level messages, for output modes that support it (lines)
 * @param {string=}	options.transformations - An optional object specifying transformation overrides to provide to node-lookml-parser
 * @param {string=}	options.dateOutput - Set to "none" to skip printing the date in the issues.md
 * @param {*=}		options.allowCustomRules - Experimental option. DO NOT USE TO RUN UNTRUSTED CODE. Pass a value to allow running of externally defined JS for custom rules
 * @param {*=}		options.jenkins - Deprecated. Use `output=jenkins,markdown` insead. Indicates that LAMS is being run by Jenkins and to include the build URL from ENV variables in the markdown output
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
	} = {},
) {
	let messages = [];
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
		const checkCustomRule = require('./lib/custom-rule/custom-rule.js');

		const cwd = options.cwd || process.cwd();
		const ignore = options.ignore || 'node_modules/**';

		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: options.source,
			conditionalCommentString: 'LAMS',
			fileOutput: 'by-name',
			transformations: {
				applyExtensionsRefinements: true,
				...(options.transformations||{}),
			},
			cwd,
			globOptions: {
				ignore,
			},
			// console: defaultConsole
		});
		if (project.error) { // Fatal error
			throw (project.error);
		}
		if (project.errors) {
			console.log('> Issues occurred during parsing (containing files will not be considered. See messages for details.)');
			messages = messages.concat(project.errors.map((e) => {
				const exception = e && e.error && e.error.exception || {};
				const messageDefault = {
					rule: 'P0',
					location: `file:${e.$file_path}`,
					level: options.onParserError === 'info' ? 'info' : 'error',
					description: `Parsing error: ${exception.message || e}`,
					path: e.$file_path,
				};
				if (exception.name === 'SyntaxError') {
					return {
						...messageDefault,
						rule: 'P1',
						hint: exception.context,
					};
				}
				return messageDefault;
			}));
		}
		console.log('> Parsing done!');


		/* Loading project manifest settings */ {
			console.log('Getting manifest and rule info...');
			const loadManifest = require('./lib/loaders/manifest/manifest.js');
			const loadManifestResult = await loadManifest(project, {
				cwd,
				manifestDefaults: options.manifestDefaults,
				manifestOverrides: options.manifest,
			}, {process});
			project.manifest = loadManifestResult.manifest;
			messages = messages.concat(loadManifestResult.messages);
		}

		/* Loading central exemptions */ {
			const {lamsRuleExemptionsPath} = options;
			const loadLamsExemptions = require('./lib/loaders/lams-exemptions.js');
			const result = await loadLamsExemptions({cwd, lamsRuleExemptionsPath});
			messages = messages.concat(result.messages || []);
			project.centralExemptions = result.centralExemptions;
		}

		project.name = false
			|| project.manifest && project.manifest.project_name
			|| options.projectName
			|| (options.cwd || process.cwd() || '').split(path.sep).filter(Boolean).slice(-1)[0]	// The current directory. May not actually be the project name...
			|| 'unknown_project';

		console.log('> Manifest and exemptions done');

		console.log('Checking rules... ');

		let builtInRuleNames =
		fs.readdirSync(path.join(__dirname, 'rules'))
			.map((fileName) => fileName.match(/^(.*)\.js$/)) // TODO: (v3) rename t2-10.js to just t2.js
			.filter(Boolean)
			.map((match) => match[1].toUpperCase());

		if (!project.manifest) {
			console.log(' > No project manifest available in which to find rule declarations/settings.');
		} else if (!project.manifest.rule) {
			console.log(' > No rules specified in manifest. As of LAMS v3, built-in rules must be opted-in to.');
		}

		for (let rule of Object.values(project.manifest && project.manifest.rule || {})) {
			console.log('> ' + rule.$name);
			if (rule.enabled === false) {
				continue;
			}
			if (builtInRuleNames.includes(rule.$name) && !rule.custom) { // Built-in rule
				if (rule.match || rule.expr_rule || rule.description) {
					messages.push({
						rule: 'LAMS3',
						level: 'info',
						description: `Rule ${rule.$name} is a built-in rule. Some rule declaration properties (e.g. match, rule_expr) have been ignored.`,
					});
				}
				try {
					let ruleModule = require('./rules/' + rule.$name.toLowerCase() + '.js');
					let result = ruleModule(project);
					messages = messages.concat(result.messages);
				} catch (e) {
					messages.push({
						rule: 'LAMS1',
						level: 'error',
						description: `LAMS error evaluating rule ${rule.$name.toUpperCase()}: ${e.message || e}`,
					});
				}
			} else {
				messages = messages.concat(checkCustomRule(rule, project, {console}));
			}
		}
		console.log('> Rules done!');

		// Legacy custom rules
		if (project.manifest && project.manifest.custom_rules) {
			console.warn('\x1b[33m%s\x1b[0m', 'Legacy (Javascript) custom rules are unsafe and may be removed in a future major version!');
			console.log('For details, see https://looker-open-source.github.io/look-at-me-sideways/customizing-lams.html');
			if (options.allowCustomRules === undefined) {
				console.warn([
					'> Your project specifies custom Javascript-based rules. Run LAMS with `--allow-custom-rules`',
					'if you want to allow potentially unsafe local execution of this remotely-defined Javascript code:',
				].concat(project.manifest.custom_rules).join('\n  '));
			} else {
				console.log('Checking legacy custom rules...');
				let get = options.get || require('./lib/https-get.js');
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
						messages = messages.concat(result.messages.map((msg) => ({
							rule: `LCR ${u}`,
							level: 'error',
							...msg,
						})));
					} catch (e) {
						let msg = `URL #${u}: ${e && e.message || e}`;
						console.error('> ' + msg);
						messages.push({
							rule: 'LAMS2',
							level: 'error',
							message: `An error occurred while checking legacy custom rule in ${msg}`,
						});
					}
				});
				await Promise.all(customRuleRequests).catch(() => { });
				console.log('> Legacy custom rules done!');
			}
		}

		// Output
		const outputters = require('./lib/outputters/index.js');
		let errors = messages.filter((msg) => {
			return msg.level === 'error' && !msg.exempt;
		});

		const outputModes =
			options.jenkins ? 'jenkins,markdown'
				: options.output ? options.output
					: 'lines';
		for (let output of outputModes.split(',')) {
			switch (output) {
			case '': break;
			case 'add-exemptions': {
				const lamsRuleExemptionsPath = options.lamsRuleExemptionsPath;
				await outputters.addExemptions(messages, {cwd, console, lamsRuleExemptionsPath});
				break;
			}
			case 'markdown': {
				const {dateOutput} = options;
				await outputters.markdown(messages, {dateOutput, console});
				break;
			}
			case 'markdown-developer':
				await outputters.markdownDeveloper(messages, {console});
				break;
			case 'lines': {
				const verbose = options.verbose || false;
				await outputters.lines(messages, {verbose, console});
				break;
			}
			case 'legacy-cli':
				await outputters.legacyCli(messages);
				break;
			default:
				console.warn(`Unrecognized output mode: ${output}`);
			}
		}

		if (tracker.enabled) {
			await Promise.race([
				tracker.track({messages, errors: []}),
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
				tracker.track({messages, errors: [e]});
			} else {
				console.warn(`Error reporting is disabled. Run with --reporting=yes to report, or see PRIVACY.md for more info`);
			}
		} catch (e) {
			console.error(e);
			console.error(`Error reporting is not available	. Please submit an issue to https://github.com/looker-open-source/look-at-me-sideways/issues`);
		}
		process.exit(1);
	}

	return;
};
