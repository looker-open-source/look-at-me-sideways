let {testName, lams, options, mocks} = require('../../../lib/test-commons.js')(__dirname,{dirnameOffset:-1})
 
options = {...options, manifest:`./manifest.lams-lkml`}

describe('Projects', () => {
	describe(testName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console});
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

		it("it should provide correct aggregate info for explore_description (3 match, 2 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "explore_description",
				level: "info",
				description: "Rule explore_description summary: 3 matches, 2 matches exempt, and 1 errors"
			});
		});
	});
});
