// E7 was causing errors if an explore was refined. This is a regression test
// to ensure it continues working as intended.

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
				rule: 'E7',
				level: 'info',
				description: `Rule E7 summary: 3 matches, 0 matches exempt, and 1 errors`,
			});
		});

		// Rule failing as expected without refinement
		it("it should error on rule E7 for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "E7",
				level: "error",
				location: "model:bad/explore:datawarehouse_bigquery__schema_business__datamart_ecommerce__facts__orders"
			});
		});
		// Rule passing with refinement
		it("it should not error on rule E7 for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "E7",
				level: "error",
				location: "model:ok/explore:datawarehouse_bigquery__schema_business__datamart_ecommerce__facts__orders"
			});
		});
	});
});
