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
		it("should not fatally error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("it should error on rule native_primary_key_required for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "native_primary_key_required",
				level: "error",
				location: "model:bad/view:no_primary_key"
			});
		});
		it("it should not error on rule native_primary_key_required for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "native_primary_key_required",
				level: "error",
				location: "model:ok/view:ok_primary_key"
			});
		});
	});
});
