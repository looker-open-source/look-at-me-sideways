let {testName, lams, options, mocks} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})
 
options = {...options, manifest:`{"rule":{"bad":{
	"match":"$",
	"expr_rule": "false"
}}}`}

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

		it("`bad` should provide correct aggregate info (1 match, 0 exempt, 1 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "bad",
				level: "info",
				description: "Rule bad summary: 1 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("it should error on bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "bad",
				level: "error"
			});
		});

		it("`ok` should provide correct aggregate info (1 match, 0 exempt, 0 error)", ()=> {
			expect({messages}).toContainMessage({
				rule: "ok",
				level: "info",
				description: "Rule ok summary: 1 matches, 0 matches exempt, and 0 errors"
			});
		});

		it("it should not error on ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "ok",
				level: "error"
			});
		});
	});
});
