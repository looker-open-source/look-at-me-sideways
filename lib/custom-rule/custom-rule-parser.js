const {
	SExpression,
	defaultConfig,
	installCore,
	installArithmetic,
	installSequence,
	isSymbol,
} = require('liyad');
const objectFromEntries = require('fromentries');
const isHidden = require('../is-hidden.js');

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
	{
		name: '$is-array',
		fn: (state, name) => (...args) => {
			checkParamsLength('$is-array', args, 1, 1);
			return Array.isArray(args[0]);
		},
	},
	{
		name: '$includes',
		fn: (state, name) => (...args) => {
			checkParamsLength('$includes', args, 2, 2);
			return Array.isArray(args[0]) && args[0].includes(args[1]);
		},
	},
	{
		name: '$flatten',
		fn: (state, name) => (...args) => {
			checkParamsLength('$flatten', args, 1, 1);
			return Array.isArray(args[0]) ? args[0].flat() : [];
		},
	},
	{
		name: '$set-prop',
		fn: (state, name) => (...args) => {
			checkParamsLength('$set-prop', args, 3, 3);
			const [obj, key, val] = args;
			if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
				throw new Error(`[SX] $set-prop: Unsafe property access "${key}".`);
			}
			if (obj && typeof obj === 'object') {
				obj[key] = val;
			}
			return obj;
		},
	},
	{
		name: '$is-hidden',
		fn: (state, name) => (...args) => {
			checkParamsLength('$is-hidden', args, 1);
			const [path, ...rest] = args;
			let project;
			for (let i = state.scopes.length - 1; i >= 0; i--) {
				const s = state.scopes[i] && state.scopes[i].scope;
				if (s && Object.prototype.hasOwnProperty.call(s, 'project')) {
					project = s.project;
					break;
				}
			}
			const fullPath = rest.length && Array.isArray(path) ? [...path, ...rest] : path;
			return isHidden(fullPath, project);
		},
	},
	{
		name: '$__get-opt',
		fn: (state, name) => (...args) => {
			checkParamsLength('$get?', args, 1);
			return getOpt(args);
		},
	},
	{
		name: '$get-in',
		fn: (state, name) => (...args) => {
			checkParamsLength('$get-in', args, 1);
			return getOpt(args);
		},
	},
]);

function getOpt(args) {
	let v = args[0];
	for (let i = 1; i < args.length; i++) {
		if (v == null) {
			return undefined;
		}
		const key = args[i];
		if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
			throw new Error(`[SX] $get?: Unsafe property access "${key}".`);
		}
		v = (typeof key === 'number' && key < 0) ? v[v.length + key] : v[key];
	}
	return v;
}

config.macros = (config.macros || []).concat([
	{
		name: '$get?',
		fn: (state, name) => (list) => {
			if (list.length < 2) {
				throw new Error(`[SX] $get?: Invalid argument length: expected: >= 1 / args: ${list.length - 1}.`);
			}
			return [
				{symbol: '$__get-opt'},
				list[1],
				...list.slice(2).map((x) => {
					const sym = isSymbol(x);
					return sym ? sym.symbol : x;
				}),
			];
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
