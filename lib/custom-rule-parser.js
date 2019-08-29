const {	//SxFuncInfo,
		//SxMacroInfo,
		//SxSymbolInfo,
		SExpression,
		//SxParserConfig,
		defaultConfig,
		installCore,
		installArithmetic,
		installSequence
	} = require('liyad');
 
// 
// const myMacros = [
// 	{
// 		name: '$defun',
// 		fn: (state: SxParserState, name: string) => (list) => {
// 			// S expression: ($defun name (sym1 ... symN) expr ... expr)
// 			//  -> S expr  : ($__defun 'name '(sym1 ... symN) 'expr ... 'expr)
// 			return [{symbol: '$__defun'},
// 				...(list.slice(1).map(x => quote(state, x))),
// 			];
// 		}
// 	}
// ];
// 
// const mySymbols = [
// 	{name: '#t', fn: (state, name) => true}
// ];

let config = Object.assign({}, defaultConfig);

config = installCore(config);
config = installArithmetic(config);
config = installSequence(config);

//config.stripComments = true;

config.funcs = (config.funcs || []).concat([
	{
		name: "$all",
		fn: config.funcs.find(op=>op.name=='$__and').fn
	},
	{
		name: "$any",
		fn: config.funcs.find(op=>op.name=='$__or').fn
	}
]);
// config.macros = (config.macros || []).concat(myMacros);
// config.symbols = (config.symbols || []).concat(mySymbols);

module.exports = {
	config,
	parse: SExpression(config)
};