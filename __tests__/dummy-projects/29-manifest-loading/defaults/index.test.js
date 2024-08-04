let {testName, lams, options, mocks} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})
 
options = {...options, manifestDefaults:"./manifest-defaults.yaml"}

//CONTINUE HERE

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

		it("no_override should provide correct aggregate info (1 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "no_override",
				level: "info",
				description: "Rule no_override summary: 1 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("it should error on no_override", ()=> {
			expect({messages}).toContainMessage({
				rule: "no_override",
				level: "error"
			});
		});

		it("it should error on partial_override (due to incomplete rule def)", ()=> {
			expect({messages}).toContainMessage({
				rule: "partial_override",
				level: "error"
			});
		});


		it("full_override should provide correct aggregate info (1 match, 0 exempt, 0 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "full_override",
				level: "info",
				description: "Rule full_override summary: 1 matches, 0 matches exempt, and 0 errors"
			});
		});

		it("it should not error on full_override", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "full_override",
				level: "error"
			});
		});
	});
});
