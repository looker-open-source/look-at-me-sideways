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
 * @param {string=}	options.manifest - An override/alternative for the contents of the manifest file
 * @param {string=}	options.projectName - An optional name for the project, if not specified in the manifest, used to generate links back to the project in mardown output
 * @param {string=}	options.dateOutput - Set to "none" to skip printing the date in the issues.md
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
	} = {},
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
		const checkCustomRule = require('./lib/custom-rules.js');

		const cwd = options.cwd || process.cwd()

		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: options.source,
			conditionalCommentString: 'LAMS',
			fileOutput: 'array',
			cwd,
			// console: {
			// 	log: (msg) => { },
			// 	warn: (msg) => lamsMessages.push({message: msg && msg.message || msg, level: 'lams-warning'}),
			// 	error: (msg) => lamsMessages.push({message: msg && msg.message || msg, level: 'lams-error'}),
			// },
		});
		if (project.error) { //Fatal error
			throw (project.error);
		}
		if (project.errors) {
			console.error('> Issues occurred during parsing (containing files will not be considered. See messages for details.)');
			messages = messages.concat(project.errors.map((e) => {
				e = e.error || e
				const messageDefault = {
					rule: 'P0',
					level: options.onParserError === 'info' ? 'info' : 'error',
					message: `Error during parsing: ${e.message || e}`,
					path: e.$file_path,
					location: e.$file_rel,
				}
				if(e.name === 'SyntaxError'){
					return {
						...messageDefault,
						rule: 'P1',
						message: `The LookML Parser encounterd a syntax error in the file ${e.$file_path}.`,
						hint: e.message + "\n" + e.context,
					}
				}
				return messageDefault
			}));
		}
		console.log('> Parsing done!');

		project.manifest = {
			...(project.manifest||{}),
			...(options.manifest||{})
			}
		project.name = false
			|| project.manifest && project.manifest.project_name
			|| options.projectName
			|| (options.cwd || process.cwd() || '').split(path.sep).filter(Boolean).slice(-1)[0]	// The current directory. May not actually be the project name...
			|| 'unknown_project';

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
							...msg
						})));
					} catch (e) {
						let msg = `URL #${u}: ${e && e.message || e}`;
						console.error('> ' + msg);
						messages.push({
							rule: 'LAMS1',
							level: 'error',
							message: `An error occurred while checking legacy custom rule in ${msg}`,
						});
					}
				});
				await Promise.all(customRuleRequests).catch(() => { });
				console.log('> Legacy custom rules done!');
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
		// let warnings = messages.filter((msg) => {
		// 	return msg.level === 'warning' && !msg.exempt;
		// });

		const outputModes = 
			options.jenkins ? "jenkins,markdown"
			: options.output ? options.output
			: 'markdown';
		for(let output of outputModes.split(',')){
			switch(output){
				case '': break;
				case 'markdown':
					const {dateOutput} = options
					await outputMarkdown(messages,{dateOutput});
					break;
				case 'markdown-developer':
					await outputDeveloperMarkdown(messages);
					break;
				case 'jenkins':
					await outputJenkins(messages);
					break;
				case 'lines':
					const verbose = options.verbose || false;
					await outputLines(messages,{verbose});
					break;
				case 'legacy-cli':
					await outputLegacyCli(messages); 
					break;
				default:
					console.warn(`Unrecognized output mode: ${output}`);
			}
		}
		
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

	return;

	async function outputJenkins(messages){
		let errors = messages.filter((msg) => {
			return msg.level === 'error'
		});
		const buildStatus = errors.length ? 'FAILED' : 'PASSED';
		console.log(`BUILD ${buildStatus}: ${errors.length} errors found. Check .md files for details.`);
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
	}
	
	async function outputMarkdown(messsages, {dateOutput}){
		console.log('Writing issues.md...');
		const asyncTemplates = require('./lib/templates.js');
		const templates = await asyncTemplates;
		const jobURL = process.env && provess.env.BUILD_URL || undefined; 
		fs.writeFileSync('issues.md', templates.issues({
			messages,
			jobURL,
			dateOutput,
		}).replace(/\n\t+/g, '\n'));
		console.log('> issues.md done');
	}
	
	async function outputDeveloperMarkdown(messages,{console=defaultConsole}){
		console.log('Writing developer.md files...');
		const asyncTemplates = require('./lib/templates.js');
		const templates = await asyncTemplates;
		fs.writeFileSync('developer.md', templates.developer({messages}).replace(/\n\t+/g, '\n'));
		console.log('> developer.md done');
	}

	function outputLegacyCli(mesages) {
		let maxArrayLength = 5000;
		let errors = messages.filter((msg) => {
			return msg.level === 'error'
		});
		if (errors.length) {
			console.log('Errors:');
			console.dir(errors, {maxArrayLength});
		}
	}

	async function outputLines(messages,{verbose}){
		const cols = {
			level: {header:'',width:3},
			rule: {header:'Rule', width:7},
			location: {header:'Location',width:47},
			description: {header:'Description'}
		};
		console.log(Object.values(cols).map(col=>col.header.padEnd(col.width||0)).join('\t'))
		for(message of messages){
			if(message.level === "verbose" && !verbose){continue}
			const level = (
				message.level == "verbose" ? "💬" :  
				message.level == "info" ? "🛈" :
				message.level == "error" ? "❌" :
				typeof message.level == "string" ? message.level :
				"").slice(0,cols.level.width).padEnd(cols.level.width,' ');
			const rule = (message.rule || '').slice(0,cols.rule.width).padEnd(cols.rule.width,'.');
			const location = (message.location || '')
				.replace(/model:|view:|explore:|join:|dimension:|measure:|filter:/g,match=>match[0]+":")
				.slice(0,cols.location.width).padEnd(cols.location.width,'.');
			const description = message.description || '';
			console.log([level,rule,location,description].join('\t'));
		}
	}

};
