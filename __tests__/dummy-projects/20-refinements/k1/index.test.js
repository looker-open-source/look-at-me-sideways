// K1 is one of the more complex sets of rules, so while this failing test should be accurate, I am marking it as draft while I first work on other rules

const {testName, lams, options, mocks} = require('../../../../lib/test-commons.js')(__dirname,{dirnameOffset:-2})

describe('Projects', () => {
	describe(testName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
		})
		
		// Standard sanity checks
		it("should not error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("it should not contain any unexpected parser errors", ()=> {
			expect({messages}).not.toContainMessage({rule: "P0"});
			expect({messages}).not.toContainMessage({rule: "P1"});
		});

		it("it should match 3x and error once", () => {
			expect({messages}).toContainMessage({
				rule: 'K1',
				level: 'info',
				description: `Rule K1 summary: 3 matches, 0 matches exempt, and 1 errors`,
			});
		});

		// Rule failing as expected without refinement
		it("it should error on rule K1 for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "K1",
				level: "error",
				location: "model:bad/view:my_table"
			});
		});
		// Rule passing with refinement
		it("it should not error on rule K1 for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "K1",
				level: "error",
				location: "model:ok/view:my_table"
			});
		});
	});
});
