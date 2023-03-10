const {testName, lams, options, mocks} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})

describe('Projects', () => {
	describe(testName, () => {
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
		it("it should not error, because locally exempt, on K1 (pk naming convention used)", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "K1",
				level: "error"
			});
		});

		it("it should provide correct aggregate info (1 match, 1 exempt, 0 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "K1",
				level: "info",
				description: "Rule K1 summary: 1 matches, 1 matches exempt, and 0 errors"
			});
		});
	});
});
