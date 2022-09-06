const {testName, lams, options, mocks} = require('../../..//lib/test-commons.js')(__dirname)

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
