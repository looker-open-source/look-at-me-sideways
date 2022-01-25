const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname, output:"lines"}
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
		it("it should error twice on rule types_required for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:bad/view:bad_view/dimension:foo"
			});
			expect({messages}).toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:bad/view:bad_view/measure:bar"
			});
		});
		it("it should not error on rule types_required for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:ok/view:ok_view/dimension:foo"
			});
			expect({messages}).not.toContainMessage({
				rule: "types_required",
				level: "error",
				location: "model:ok/view:ok_view/measure:bar"
			});
		});
	});
});
