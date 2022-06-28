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
		it("it should error on K3 (key dimensions first)", ()=> {
			expect({messages}).toContainMessage({
				rule: "K3",
				level: "error"
			});
		});
		it("it should provide correct aggregate info (1 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "F3",
				level: "info",
				description: "Evaluated 1 matches, with 0 exempt and 1 erroring"
			});
		});
	});
});
