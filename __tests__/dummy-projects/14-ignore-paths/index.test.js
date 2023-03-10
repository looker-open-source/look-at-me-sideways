const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];


const options = {reporting:"no", cwd:__dirname,
	ignore: "misc{,2}/**"
}

describe('Projects', () => {
	describe(testProjectName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
			console.log(messages)
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
		it("it should check exactly one explore", ()=> {
			expect({messages}).toContainMessage({
				rule: "E1",
				level: "info",
				description: "Rule E1 summary: 1 matches, 0 matches exempt, and 0 errors"
			});
		});
	});
});
