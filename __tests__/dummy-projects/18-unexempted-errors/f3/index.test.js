const {testName, lams, options, mocks} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})
 
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
		it("it should provide correct aggregate info (1 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "F3",
				level: "info",
				description: "Rule F3 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("it should error on F3 (counts must be filtered)", ()=> {
			expect({messages}).toContainMessage({
				rule: "F3",
				level: "error"
			});
		});
	});
});
