const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname, onParserError:"fail"}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];

describe('Projects', () => {
	describe(testProjectName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
			log(messages)//.filter(m=>m.rule=="F1"))
		})
		it("bad.model should error on rule F1", ()=> {	
			expect(console.error).not.toHaveBeenCalled();
			expect(process.exit).not.toHaveBeenCalled();
			expect({messages}).toContainMessage({
				rule: "F1",
				level: "error",
				location: "model:bad/view:bad_view/dimension:foo"
			});
		});
		it("ok.model should not error/warn on rule F1", ()=> {
			
			expect(console.error).not.toHaveBeenCalled();
			expect(process.exit).not.toHaveBeenCalled();
			// expect({messages}).toContainMessage({
			// 	rule: "F1",
			// 	level: "info",
			// 	location: "model:ok/view:ok_view/dimension:foo"
			// });
			expect({messages}).not.toContainMessage({
				rule: "F1",
				level: "error",
				location: "model:ok/view:ok_view/dimension:foo"
			});
			expect({messages}).not.toContainMessage({
				rule: "F1",
				level: "warning",
				location: "model:ok/view:ok_view/dimension:foo"
			});
		});
	});
});