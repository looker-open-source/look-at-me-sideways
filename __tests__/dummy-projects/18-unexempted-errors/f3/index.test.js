const {testName, lams, options, mocks, log} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})
 
describe('Projects', () => {
	describe(testName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			log({options})
			messages = await lams(options,{process, console});
			log(messages.filter(m=>m.rule=="F3"))
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
				description: "Evaluated 1 matches, with 0 exempt and 1 erroring"
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
