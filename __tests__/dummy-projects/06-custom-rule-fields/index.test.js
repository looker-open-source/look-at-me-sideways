const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];

const rule = "types_required"
const ruleIsTypesRequired = {rule: "types_required"}
const levelIsError = {level: "error"}
const levelIsInfo = {level: "info"}

describe('Projects', () => {
	describe(testProjectName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
		})
		it("should not error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("the overall project should contain 4 matches, 0 matches exempt, and 2 errors for types_required", ()=> {
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsInfo,
				description: `Rule ${rule} summary: ${4} matches, ${0} matches exempt, and ${2} errors`
			});
		});

		it("it should error twice on rule types_required for model:bad", ()=> {
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: "model:bad/view:bad_view/dimension:foo"
			});
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: "model:bad/view:bad_view/measure:bar"
			});
		});
		it("it should not error on rule types_required for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: "model:ok/view:ok_view/dimension:foo"
			});
			expect({messages}).not.toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: "model:ok/view:ok_view/measure:bar"
			});
		});
	});
});
