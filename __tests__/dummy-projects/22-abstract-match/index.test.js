let {testName, lams, options, mocks} = require('../../../lib/test-commons.js')(__dirname,{dirnameOffset:-1})

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

		it("it should match E7 once", ()=> {
			expect({messages}).toContainMessage({
				rule: "E7",
				level: "info",
				description: "Rule E7 summary: 1 matches, 0 matches exempt, and 0 errors"
			});
		});

		it("it should not error E7", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "E7",
				level: "error"
			});
		});
	});
});
