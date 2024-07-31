const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {
	reporting:"no",
	cwd:__dirname,
	source:"{manifest.lkml,*.model.lkml,*.dashboard.lookml}"
};
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];

describe('Projects', () => {
	describe(testProjectName + " (needs js-yaml optional dependency)", () => {
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

		it("it should match DASH_1 (3 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "DASH_1",
				level: "info",
				description: "Rule DASH_1 summary: 3 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("it should error on DASH_1", ()=> {
			expect({messages}).toContainMessage({
				rule: "DASH_1",
				level: "error"
			});
		});
	});
});
