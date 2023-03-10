const {
	SExpression,
	defaultConfig,
	installCore,
	installArithmetic,
	installSequence,
} = require('liyad');
const objectFromEntries = require('fromentries');

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
	{
		name: '$if',
		fn: config.funcs.find((op) => op.name == '$__if').fn,
	},
	{
		name: '$object-entries',
		fn: (state, name) => (...args) => {
			checkParamsLength('$object-entries', args, 1, 1);
			return Object.entries(args[0] || {});
		},
	},
	{
		name: '$object-values',
		fn: (state, name) => (...args) => {
			checkParamsLength('$object-values', args, 1, 1);
			return Object.values(args[0] || {});
		},
	},
	{
		name: '$object-keys',
		fn: (state, name) => (...args) => {
			checkParamsLength('$object-keys', args, 1, 1);
			return Object.keys(args[0] || {});
		},
	},
	{
		name: '$object-from-entries',
		fn: (state, name) => (...args) => {
			checkParamsLength('$object-keys', args, 1, 1);
			return objectFromEntries(args[0]);
		},
	},
]);

module.exports = {
	config,
	parse: new SExpression(config),
};
/**
 * Validate the expected number of arguments
 * @param {string} name Name to display in error messages
 * @param {[*]} args Args array-like to validate
 * @param {number} min Min number of arguments
 * @param {number?} max Optional max number of arguments
 * @return {[*]} Returns the original args, if validation didn't throw
 */
function checkParamsLength(name, args, min, max) {
	if (args.length < min) {
		throw new Error(`[SX] ${name}: Invalid argument length: expected: ${min} / args: ${args.length}.`);
	}
	if (max && max < args.length) {
		throw new Error(`[SX] ${name}: Invalid argument length: expected: ${max} / args: ${args.length}.`);
	}
	return args;
}
