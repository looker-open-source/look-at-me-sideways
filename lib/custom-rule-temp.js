const {	SExpression,
		defaultConfig,
		installCore,
	} = require('liyad')

let config = Object.assign({}, defaultConfig)
//config = installCore(config)
let parse = SExpression(config)
let obj = {}

let fn1 = parse(`( -> (match) 
		(::match:constructor:prototype:foo= 1)
	)`)
fn1({})
console.log(obj.foo) //1

let fn2 = parse(`( -> (match) 
		(::match:constructor@assign ::match:constructor:prototype (# ("bar" 2)) )
	)`)
fn2({})
console.log(obj.bar) //2