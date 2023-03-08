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
const levelIsVerbose = {level: "verbose"}

const view = "model:mixed/view:my_view"

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
		it("the overall project should contain 3 matches, 1 match exempt, and 1 error for types_required", ()=> {
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsInfo,
				description: `Rule ${rule} summary: ${3} matches, ${1} matches exempt, and ${1} errors`
			});
		});


		it("it should not error on rule types_require for dimension:ok", ()=> {
			expect({messages}).not.toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: `${view}/dimension:ok`
			});
		});
		it("it should error once without exemption on rule types_required for dimension:bad", ()=> {
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsError,
				location: `${view}/dimension:bad`
			});
		});
		it("it should error once WITH exemption on rule types_required for dimension:exempt", ()=> {
			expect({messages}).toContainMessage({
				...ruleIsTypesRequired,
				...levelIsVerbose,
				exempt: true,
				location: `${view}/dimension:exempt`
			});
		});
	});
});
