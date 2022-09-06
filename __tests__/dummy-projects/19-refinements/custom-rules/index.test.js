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

		// Rule failing as expected without refinement
		it("it should error on rule explore_descriptions for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "explore_descriptions",
				level: "error",
				location: "model:bad/explore:needs_refinement"
			});
		});
		it("it should error on rule dimension_types for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "dimension_types",
				level: "error",
				location: "model:bad/view:needs_refinement/dimension:id"
			});
		});

		// Rule passing with refinement
		it("it should not error on rule explore_descriptions for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "explore_descriptions",
				level: "error",
				location: "model:ok/explore:needs_refinement"
			});
		});
		it("it should not error on rule dimension_types for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "dimension_types",
				level: "error",
				location: "model:ok/view:needs_refinement/dimension:id"
			});
		});
	});
});
