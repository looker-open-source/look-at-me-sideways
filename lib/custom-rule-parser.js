const {
	SExpression,
	defaultConfig,
	installCore,
	installArithmetic,
	installSequence,
} = require('liyad');

let config = Object.assign({}, defaultConfig);

config = installCore(config);
config = installArithmetic(config);
config = installSequence(config);

config.funcs = (config.funcs || []).concat([
	{
		name: '$all',
		fn: config.funcs.find((op) => op.name == '$__and').fn,
	},
	{
		name: '$any',
		fn: config.funcs.find((op) => op.name == '$__or').fn,
	},
	{
		name: '$let',
		fn: config.funcs.find((op) => op.name == '$__let').fn,
	},
]);

module.exports = {
	config,
	parse: new SExpression(config),
};
