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

		it("it should provide correct aggregate info for require_persist_for (2 match, 1 exempt, 0 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "require_persist_for",
				level: "info",
				description: "Rule require_persist_for summary: 2 matches, 1 matches exempt, and 0 errors"
			});
		});

		it("it should not error on require_persist_for", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "require_persist_for",
				level: "error"
			});
		});

		it("it should provide correct aggregate info for really_require_persist_for (2 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "really_require_persist_for",
				level: "info",
				description: "Rule really_require_persist_for summary: 2 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("it should error on really_require_persist_for for model bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "really_require_persist_for",
				location: "model:bad",
				level: "error"
			});
		});

		it("it should not error on really_require_persist_for for model good", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "really_require_persist_for",
				location: "model:good",
				level: "error"
			});
		});
	});
});
