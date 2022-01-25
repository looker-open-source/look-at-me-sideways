/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const tracking = require('../lib/tracking');
require('../lib/expect-to-contain-message');

describe('CLI', () => {
	const mocks = ({fs = {}, spies = {}} = {}) => ({
		process: {
			exit: jest.fn(() => { }),
		},
		console: {
			log: jest.fn(() => { }),
			warn: jest.fn(() => { }),
			debug: (x) => console.debug(x),
		},
		os: {
			homedir: () => '~',
		},
		fs: {
			writeFileSync: (path, contents) => (fs[path] = contents, true),
			readFileSync: (path) => fs[path],
			mkdirSync: (path) => { },
		},
		https: {
			request: () => {
				let req = {
					write: (body) => { },
					end: () => { },
				};
				spies.httpsRequestWrite = jest.spyOn(req, 'write');
				return req;
			},
		},
		spies,
	});

	const realFs = require('fs');
	const path = require('path');
	const privacyPolicyPath = path.resolve(__dirname, '../PRIVACY.md');
	const privacyPolicy = realFs.readFileSync(privacyPolicyPath, 'utf-8');
	const appVersion = JSON.parse(realFs.readFileSync(path.resolve(__dirname, '../package.json'))).version;
	const initFs = {
		[privacyPolicyPath]: privacyPolicy,
	};

	it('should print PP and exit if an invalid reporting argument is passed', () => {
		let {console, process} = mocks();
		tracking({
			cliArgs: {reporting: 'bla'},
			console,
			process,
		});
		expect(console.log).toHaveBeenCalledWith(privacyPolicy.replace(/\n/g, '\n  '));
		expect(process.exit).toHaveBeenCalledWith(1);
	});
	it('should print PP and exit if no reporting argument is passed and no settings exist', () => {
		let {console, process, fs} = mocks({fs: initFs});
		tracking({
			cliArgs: {},
			process,
			console,
			fs,
		});
		expect(console.log).toHaveBeenCalledWith(privacyPolicy.replace(/\n/g, '\n  '));
		expect(process.exit).toHaveBeenCalledWith(1);
	});
	it('should return an object with enabled false if reporting argument is no', () => {
		let {console, process, fs} = mocks({fs: initFs});
		const tracker = tracking({
			cliArgs: {reporting: 'no'},
			console,
			process,
			fs,
		});
		expect(tracker).toMatchObject({enabled: false});
	});
	it('should return an object with enabled false if reporting argument is save-no', () => {
		let {console, process, fs} = mocks({fs: initFs});
		const tracker = tracking({
			cliArgs: {reporting: 'save-no'},
			console,
			process,
			fs,
		});
		expect(tracker).toMatchObject({enabled: false});
	});
	it('should return an object with enabled false if reporting argument was previously save-no', () => {
		let {console, process, fs} = mocks({fs: initFs});
		tracking({
			cliArgs: {reporting: 'save-no'},
			console,
			process,
			fs,
		});
		({console, process} = mocks());
		const tracker = tracking({
			cliArgs: {},
			process,
			console,
			fs,
		});
		expect(tracker).toMatchObject({enabled: false});
	});
	it('should return a callable request function if reporting argument is yes', () => {
		let {console, process, fs, https, spies} = mocks({fs: initFs});
		const tracker = tracking({
			cliArgs: {reporting: 'yes'},
			console,
			process,
			fs,
			https,
		});
		expect(tracker).toMatchObject({
			valid: true,
			enabled: true,
		});
		tracker.track({});
		expect(spies.httpsRequestWrite).toHaveBeenCalled();
	});
	it('should return a callable request function if reporting argument is save-yes', () => {
		let {console, process, fs, https, spies} = mocks({fs: initFs});
		const tracker = tracking({
			cliArgs: {reporting: 'save-yes'},
			console,
			process,
			fs,
			https,
		});
		expect(tracker).toMatchObject({
			valid: true,
			enabled: true,
		});
		tracker.track({});
		expect(spies.httpsRequestWrite).toHaveBeenCalled();
	});
	it('should return a callable request function if reporting argument was previously save-yes', () => {
		let {console, process, fs, https, spies} = mocks({fs: initFs});
		tracking({
			cliArgs: {reporting: 'save-yes'},
			console,
			process,
			fs,
		});
		({console, process, https, spies} = mocks());
		const tracker = tracking({
			cliArgs: {},
			console,
			process,
			fs,
			https,
		});
		expect(tracker).toMatchObject({
			valid: true,
			enabled: true,
		});
		tracker.track({});
		expect(spies.httpsRequestWrite).toHaveBeenCalled();
	});

	it('should warn, print PP and exit if no reporting argument is passed and PP has changed since reporting preferences were saved', () => {
		let {console, process, fs} = mocks({fs: initFs});
		tracking({
			cliArgs: {reporting: 'save-yes'},
			process,
			console,
			fs,
		});
		expect(console.warn).not.toHaveBeenCalled();
		expect(process.exit).not.toHaveBeenCalled();
		fs.writeFileSync(privacyPolicyPath, 'Bla bla bla');
		({console, process} = mocks());
		tracking({
			cliArgs: {},
			process,
			console,
			fs,
		});
		expect(console.warn).toHaveBeenCalled();
		expect(console.log).toHaveBeenCalledWith('Bla bla bla'.replace(/\n/g, '\n  '));
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	it('should send a payload', () => {
		let {console, process, fs, https, spies} = mocks({fs: initFs});
		const tracker = tracking({
			cliArgs: {reporting: 'yes', reportUser: 'foo@test.com'},
			gaPropertyId: 'test',
			console,
			process,
			fs,
			https,
		});
		let errors = [];
		let messages = [{
			rule: 'foo',
			exempt: false,
			level: 'error',
		}, {
			rule: 'foo',
			exempt: false,
			level: 'error',
		}, {
			rule: 'baz',
			exempt: false,
			level: 'info',
		},
		];
		tracker.track({messages, errors});
		expect(spies.httpsRequestWrite).toHaveBeenCalledWith(`v=1&an=LAMS&av=${appVersion}&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&cd1=834b0d7807e798000493db52fd650814e534a8f742a1c5a58cbb7b42879696e0&cd2=&ec=Run&ea=End
			v=1&an=LAMS&av=${appVersion}&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&ec=Rule%20Result&ea=foo%20error&el=false&ev=2&cd3=foo&ni=1
			v=1&an=LAMS&av=${appVersion}&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&ec=Rule%20Result&ea=baz%20info&el=false&ev=1&cd3=baz&ni=1`.replace(/\t+/g, ''));
	});
});
