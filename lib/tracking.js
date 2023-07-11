/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const defaultProcess = process;
const defaultConsole = console;
const pjson = require('../package.json');
const {groupBy} = require('../lib/outputters/templating/template-functions');

exports = module.exports = function({
	cliArgs = {},
	gaPropertyId,
	https = require('https'),
	fs = require('fs'),
	os = require('os'),
	process = defaultProcess,
	console = defaultConsole,
} = {}) {
	const path = require('path');
	const crypto = require('crypto');
	let valid=false;
	let enabled=false;
	let userHash;
	let licenseKey;
	let guid;
	let prefTimestamp;
	let privacyPolicyPath = path.resolve(__dirname, '../PRIVACY.md');
	let privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf-8');
	let privacyDigest = crypto.createHash('sha256').update(privacyPolicy, 'utf8').digest('hex');
	let digestMismatch;
	{/* Process prefs */
		let userEmailOrHash; let saveReporting;
		const settingsDir = path.resolve(os.homedir(), '.look-at-me-sideways');
		const settingsPath = path.join(settingsDir, 'settings.json');
		const settings = (()=>{
			try {
				let str = fs.readFileSync(settingsPath, 'utf-8');
				return ( str.trim()[0]==='{' ? JSON.parse(str) : {} );
			} catch (e) {
				return {};
			}
		})();
		if (cliArgs.reporting) {
			let match = cliArgs.reporting.toLowerCase().match(/^(save-)?(yes|no)$/i)||[];
			valid = !!match[0];
			saveReporting = !!match[1];
			enabled = match[2]==='yes';
			licenseKey = cliArgs.reportLicenseKey;
			userEmailOrHash = cliArgs.reportUser;
			userHash =
				!userEmailOrHash
					? ''
					: userEmailOrHash.match(/^[a-fA-F0-9]{64}$/)
						? userEmailOrHash
						: userEmailOrHash.match(/^[^@/]+@[^@/]+$/)
							? crypto.createHash('sha256').update(userEmailOrHash.trim().toLowerCase(), 'utf8').digest('hex')
							: new Error('Invalid email or hash for \'report-user\' argument.');
			if (userHash instanceof Error) {
				throw userHash;
			}
			guid = userEmailOrHash
				? newGuid(userHash)
				: settings.defaultGuid || newGuid();
			prefTimestamp = Date.now();
		} else {
			let reporting = (settings.reporting||{});
			valid = typeof reporting.enabled === 'boolean' && reporting.privacyDigest === privacyDigest;
			digestMismatch = reporting.privacyDigest !== privacyDigest;
			saveReporting = false;
			guid = settings.guid;
			({enabled, licenseKey, userHash} = reporting);
		}
		try {
			let updatedSettings = {
				defaultGuid: settings.defaultGuid || (userEmailOrHash?undefined:guid),
				reporting: saveReporting
					? {enabled, userHash, licenseKey, privacyDigest, timestamp: prefTimestamp}
					: settings.reporting,
			};
			try {
				fs.mkdirSync(settingsDir);
			} catch (e) {
				if (e.code === 'EEXIST') {
					// already exists, OK
				} else {
					throw e;
				}
			}
			fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings));
		} catch (e) {
			// Do nothing
		}
	}
	if (!valid) {
		if (digestMismatch) {
			console.warn(
				'\x1b[33mThe privacy policy has been updated since you last opted-in. You may review the changes here:\x1b[0m'
				+'\n https://github.com/looker-open-source/look-at-me-sideways/commits/master/PRIVACY.md',
			);
		}
		console.log(privacyPolicy.replace(/\n/g, '\n  '));
		process.exit(1);
	}

	return {
		valid,
		enabled,
		track: ({messages=[], errors=[]})=>{
			if (!valid) {
				throw new Error('Invalid tracking state');
			}
			if (!enabled) {
				return;
			}
			let hits = [];
			// required GA payload params
			const staticParameters = {
				v: 1,				// version
				an: 'LAMS',			// application name
				av:	pjson.version,	// application version
				tid: gaPropertyId,	// tracking id
				cid: guid, 			// anon client id
				t: 'event',			// hit type
			};

			let encode = (o) => Object.keys(o).map((key) => key + '=' + encodeURIComponent(o[key])).join('&');
			hits.push(encode({
				...staticParameters,
				cd1: (userHash).slice(0, 64),
				cd2: (licenseKey||'').slice(0, 50),
				ec: 'Run',
				ea: 'End',
			}));
			if (messages.length) {
				let rollup = messages.reduce(groupBy({grouping: ['rule', 'level', 'exempt']}), null);
				for (let rule of Object.values(rollup.subgroups)) {
					for (let level of Object.values(rule.subgroups)) {
						for (let exempt of Object.values(level.subgroups)) {
							hits.push(encode({
								...staticParameters,
								ec: 'Rule Result', 					// event category
								ea: rule.key+' '+level.key,			// event action
								el: (''+exempt.key).slice(0, 50),	// event label
								ev: exempt.summaries.count,			// event value
								cd3: rule.key,
								ni: 1,								// non interactive event
							}));
						}
					}
				}
			}
			for (let error of errors) {
				hits.push(encode({
					...staticParameters,
					ec: 'Error',
					ea: error.isFatal ? 'Fatal Error' : 'Error',
					el: error.message||error,
					ni: 1,
				}));
			}

			// batch max number of hits in each request
			let responses = [];
			for (let i=0; i<hits.length; i+=20) {
				responses.push(request({
					body: hits.slice(i, i+20).join('\n'),
				}));
			}
			return Promise.all(responses);
		},
	};

	/**
	 * GUID function per https://stackoverflow.com/a/2117523
	 * @param {string} [hex]
	 * @return {string}
	 */
	function newGuid(hex) {
		let rnds;
		if (hex) {
			rnds = Buffer.from(hex.slice(0, 32), 'hex');
		} else {
			rnds = crypto.randomBytes(16);
		}
		rnds[6] = (rnds[6] & 0x0f) | 0x40;
		rnds[8] = (rnds[8] & 0x3f) | 0x80;
		rnds = rnds.toString('hex');
		rnds = rnds.slice(0, 8)+'-'+rnds.slice(8, 12)+'-'+rnds.slice(12, 16)+'-'+rnds.slice(16, 20)+'-'+rnds.slice(20);
		return rnds;
	}
	/**
	 * Function that submits tracking event
	 * @param {*} param0
	 * @return {Promise}
	 */
	function request({
		method = 'POST',
		hostname = 'www.google-analytics.com',
		port,
		path = '/batch',
		body,
	}) {
		return new Promise((res, rej)=>{
			let requestConfig = {
				method,
				hostname,
				...(port?{port}:{}),
				path: path,
			};
			let req = https.request(requestConfig, (resp)=>{
				resp.on('error', (err) => {
					rej(err.message);
				});
				resp.on('end', () => res(resp));
			});
			if (body !== undefined) {
				req.write(body);
			}
			req.end();
		});
	}
};
