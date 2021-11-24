const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];

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
		it("it should not error on rule types_require for dimension:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:mixed/view:my_view/dimension:ok"
			});
		});
		it("it should error once without exemption on rule types_required for dimension:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:mixed/view:my_view/dimension:bad"
			});
		});
		it("it should error once WITH exemption on rule types_required for dimension:exempt", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "types_required",
				level: "error",
				exempt: true,
				location: "model:mixed/view:ok_view/dimension:foo"
			});
		});
	});
});
