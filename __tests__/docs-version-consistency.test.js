/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
const pathlib = require('path');
const fs = require('fs');

const packageJson = require('../package.json');
const [major, minor, patch] = packageJson.version.split('.');
const packageVersion = {major, minor, patch};
const filePaths = [
	'../README.md',
	'../docs/github-action.md',
	'../docs/gitlab-ci.md',
	// '../docker/Dockerfile' // This doc does not yet use NPM. It should first be updated to use NPM.
];


describe('Docs version consistency', () => {
	filePaths.forEach((filePath)=>{
		it(filePath.replace('../', ''), async () => {
			const file = await read(filePath);
			const commands = file.match(/npm\s*(-g)?\s*i(nstall)?\s*(-g)?\s*@looker\/look-at-me-sideways(@([0-9.]+))?/g) || [];
			expect(commands).not.toHaveLength(0);
			for (let command of commands) {
				const [match, tag, version] = command.match(/look-at-me-sideways(@([0-9.]+))/) || []; // eslint-disable-line no-unused-vars
				const [major, minor, patch] = (version||'').split('.');
				const fileVersion = {major, minor, patch};
				expect(fileVersion.major).toBe(packageVersion.major);
			}
		});
	});
});

/**
 * Async read file contents. Assumes UTF-8 encoding.
 * @param {string} filepath Path to the file. Relative path is resolved from the location of this source code file.
 * @return {Promise<string>} The contents of the file
 */
function read(filepath) {
	return new Promise((resolve, reject) =>
		fs.readFile(pathlib.resolve(__dirname, filepath), 'utf-8', (err, data)=>{
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		}),
	);
}
