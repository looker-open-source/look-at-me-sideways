const lams = require('../../../../index.js')
const mocks = require('../../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname}
require('../../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-2).join(" > ");

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
		it("it should not contain any unexpected parser (P0) errors", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "P0",
				level: "error"
			});
		});
		it("it should not contain any parser syntax (P1) errors", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "P1",
				level: "error"
			});
		});
		it("it should match on T2 once", ()=> {
			expect({messages}).toContainMessage({
				rule: "T2",
				level: "info",
				description: 'Rule T2 summary: 1 matches, 1 matches exempt, and 0 errors'
			});
		});
		it("it should not error, because T2 is exempt, on T8 (missing separator line)", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "T8",
				level: "error"
			});
		});
	});
});
