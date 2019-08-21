#! /usr/bin/env node
/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
!async function() {
	let messages = []; let lamsMessages = []; let tracker = {};
	try {
		const cliArgs = require('minimist')(process.argv.slice(
			process.argv[0]=='lams'
				? 1 // e.g. lams --bla
				: 2 // e.g. node index.js --bla
		));
		const fs = require('fs');
		const path = require('path');
		const tracker = require('./lib/tracking')({
			cliArgs,
			gaPropertyId: 'UA-96247573-2',
		});
		const parser = require('lookml-parser');
		const dot = require('dot');
		const templateFunctions = require('./lib/template-functions.js');

		dot.templateSettings = {
			...dot.templateSettings,
			evaluate: /\{\{!([\s\S]+?)\}\}/g,
			interpolate: /\{\{=([\s\S]+?)\}\}/g,
			encode: /\{\{&([\s\S]+?)\}\}/g,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate: /\{\{\*\s*(?:\}\}|([\s\S]+?)\s*:\s*([\w$]+)\s*(?::\s*([\w$]+))?\s*\}\})/g,
			varname: 'ctx',
			strip: false,
		};
		dot.process({path: path.join(__dirname, 'templates')});
		const templates = {
			developer: require('./templates/developer'),
			issues: require('./templates/issues'),
		};
		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: cliArgs.input || cliArgs.i,
			conditionalCommentString: 'LAMS',
			fileOutput:"array",
			console: {
				log: (msg) => {},
				warn: (msg) => lamsMessages.push({message: msg&&msg.message||msg, level: 'lams-warning'}), // LAMS warnings should not abort the deploy
				error: (msg) => lamsMessages.push({message: msg&&msg.message||msg, level: 'lams-error'}), // LAMS errors should abort the deploy
			},
		});
		if (project.errors) {
			console.log(project.errors);
			lamsMessages = lamsMessages.concat(project.errors.map((e) =>
				({message: e&&e.message||e, level: 'lams-error'})
			));
			console.error('> Issues occurred during parsing (containing files will not be considered):');
			project.errorReport();
		}
		if (project.error) {
			throw (project.error);
		}
		project.name = false
			|| project.file && project.file.manifest && project.file.manifest.project_name
			|| cliArgs['project-name']
			|| (''+process.cwd()).split(path.sep).filter(Boolean).slice(-1)[0]	// The current directory. May not actually be the project name...
			|| 'unknown_project';
		if (project.name === 'look-at-me-sideways') {
			lamsMessages.push({level: 'lams-warning', message: 'Consider adding a manifest.lkml file to your project to identify the project_name'});
		}
		console.log('> Parsing done!');

		console.log('Checking rules... ');
		let rules = fs.readdirSync(path.join(__dirname, 'rules')).map((fileName) => fileName.match(/^(.*)\.js$/)).filter(Boolean).map((match) => match[1]);
		for (let r of rules) {
			console.log('> '+r.toUpperCase());
			let rule = require('./rules/'+r+'.js');
			let result = rule(project);
			messages = messages.concat(result.messages.map((msg)=>({rule: r, ...msg})));
		}
		console.log('> Rules done!');
		if (project.file && project.file.manifest && project.file.manifest.custom_rules) {
			console.log('Checking custom rules...');
			if (cliArgs['allow-custom-rules'] !== undefined) {
				let requireFromString = require('require-from-string');
				let get = require('./lib/https-get.js');
				let customRuleRequests = [];
				project.file.manifest.custom_rules.forEach(async (url, u) => {
					try {
						let request = get(url);
						customRuleRequests.push(request);
						let ruleSrc = await request;
						console.log('> #'+u);
						let rule = requireFromString(ruleSrc, {
							prependPaths: path.resolve(__dirname, './rules'),
						});
						let result = rule(project);
						messages = messages.concat(result.messages.map((msg)=>({rule: `Custom Rule ${u}`, ...msg})));
					} catch (e) {
						let msg = `URL #${u}: ${e&&e.message||e}`;
						console.error('> '+msg);
						lamsMessages.push({
							level: 'lams-error',
							message: `An error occurred while checking custom rule in ${msg}`,
						});
					}
				});
				await Promise.all(customRuleRequests).catch(() => {});
				console.log('> Custom rules done!');
			} else {
				console.warn([
					'> Your project specifies custom rules. Run LAMS with `--allow-custom-rules`',
					'if you want to allow local execution of this remotely-defined Javascript code:',
				].concat(project.file.manifest.custom_rules).join('\n  '));
			}
		}

		let errors = messages.filter((msg) => {
			return msg.level==='error' && !msg.exempt;
		});
		let warnings = messages.filter((msg) => {
			return msg.level==='warning' && !msg.exempt;
		});
		let lamsErrors = messages.filter((msg) => {
			return msg.level==='lams-errors' && !msg.exempt;
		});

		const buildStatus = (errors.length || warnings.length || lamsErrors.length) ? 'FAILED' : 'PASSED';
		console.log(`BUILD ${buildStatus}: ${errors.length} errors and ${warnings.length} warnings found. Check .md files for details.`);

		let jobURL;
		if (cliArgs.jenkins) {
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
		fs.writeFileSync('developer.md', templates.developer({messages, fns: templateFunctions}).replace(/\n\t+/g, '\n'));
		console.log('> Developer index done');
		fs.writeFileSync('issues.md', templates.issues({messages, jobURL, fns: templateFunctions}).replace(/\n\t+/g, '\n'));
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
		} else {
			process.exit(0);
		}
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
}();
