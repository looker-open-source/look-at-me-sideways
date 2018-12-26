/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
/**
 * Get a request string over https
 * @param {*} param0
 * @return {Promise}
 */
const https = require('https');
module.exports = function request(url='') {
	let [, scheme, hostname, port, path] = (url.match(/^([^:/]+):\/\/([^:/]+)(:\d+)?(\/[^?#]+)?/)||[]);
	if (!scheme) {
		throw Error('Invalid URL');
	}
	if (scheme!=='https') {
		throw Error('Only https is allowed.');
	}
	return new Promise((res, rej)=>{
		let requestConfig = {
			method: 'GET',
			hostname,
			...(port?{port: port.slice(1)}:{}),
			path,
		};
		let req = https.request(requestConfig, (resp)=>{
			let data = '';
			resp.on('error', (err) => {
				rej(err.message);
			});
			resp.on('data', (chunk) => {
				data += chunk;
			});
			resp.on('end', () => res(data));
		});
		req.end();
	});
};
