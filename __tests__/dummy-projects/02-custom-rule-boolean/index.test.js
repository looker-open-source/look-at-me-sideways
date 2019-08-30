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
		it("it should error on rule no_dev for model:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "no_dev",
				level: "error",
				location: "model:bad"
			});
		});
		it("it should not error on rule no_dev for model:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "no_dev",
				level: "error",
				location: "model:ok"
			});
		});
	});
});
