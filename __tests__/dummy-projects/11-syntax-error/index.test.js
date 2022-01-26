const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];

describe('Projects', () => {
	describe(testProjectName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
		})
		it("should not error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("it should report an error-level message for the file that couldn't be parsed", ()=> {
			expect({messages}).toContainMessage({
				rule: "P1",
				level: "error"
			});
		});
		it("it should still evaluate other files and error for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "E2",
				level: "error",
				location: "model:bad/explore:bad/join:foo"
			});
		});
		it("it should still evaluate other files and not error for model:ok", ()=> {
			expect({messages}).toContainMessage({
				rule: "E2",
				level: "info",
			});
			expect({messages}).not.toContainMessage({
				rule: "E2",
				level: "error",
				location: "model:ok/explore:ok/join:foo"
			});
		});
	});
});
