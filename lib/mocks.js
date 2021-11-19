module.exports = function createMocks(
	{
		fs={}, // "Files" to initialize the "filesystem" with
		spies={},
	}={},
) {
	return {
		process: {
			exit: jest.fn(()=>{}),
			cwd: ()=>process.cwd(),
		},
		console: {
			log: jest.fn(()=>{}),
			warn: jest.fn(()=>{}),
			error: jest.fn(()=>{}),
			debug: jest.fn((x)=>console.debug(x)),
		},
		os:	{
			homedir: ()=>'~',
		},
		fs: {
			writeFileSync: jest.fn((path, contents) => (fs[path]=contents, true)),
			readFileSync: (path) => fs[path],
			mkdirSync: (path) => {},
		},
		https: {
			request: ()=>{
				let req = {
					write: (body)=>{},
					end: () => {},
				};
				spies.httpsRequestWrite = jest.spyOn(req, 'write');
				return req;
			},
		},
		spies,
	};
};
