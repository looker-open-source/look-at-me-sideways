let {config} = require('./lib/custom-rule/custom-rule-parser.js');

console.table(config.funcs.map((fn) => ({
	name: fn.name,
	fn: fn.fn.toString()
		.replace(/^[^{]*{\s*|\s*}[^}]*$/ig, '')
		.replace(/\/\/[^:]*:/g, '')
		.replace(/\\r|\\n/g, ' ')
		.replace(/\s+/g, ' ')
		.slice(0, 80),
})));
