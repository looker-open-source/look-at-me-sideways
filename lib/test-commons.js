const lams = require('../index.js');
const mocks = require('./mocks.js');
const path= require('path');
require('./expect-to-contain-message');
const log = (x)=>console.log(x);

module.exports = function TestCommons(dirname, {
	dirnameOffset=-1,
}={}) {
	return {
		lams,
		mocks,
		path,
		log,
		testName: dirname.split(path.sep).slice(dirnameOffset).join(' > '),
		options: {reporting: 'no', cwd: dirname},
	};
};
