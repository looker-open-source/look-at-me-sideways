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
		it("it should not contain any unexpected parser (P0) errors", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "P0",
				level: "error"
			});
		});
		it("it should not contain any parser syntax (P1) errors", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "P1",
				level: "error"
			});
		});

		it("it should not error on rule no_abs_self_links for dimension:ok", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "no_abs_self_links",
				level: "error",
				location: "model:mixed/view:my_view/dimension:ok/link",
			});
		});
		it("it should error on rule no_abs_self_links for dimension:bad", ()=> {
			expect({messages}).toContainMessage({
				rule: "no_abs_self_links",
				level: "error",
				location: "model:mixed/view:my_view/dimension:bad/link",
				description: "Self-links should not be absolute. Found https://my.looker.com/dashboards/1?value={{value}}"
			});
		});
		it("it should error on rule no_abs_self_links for dimension:mixed", ()=> {
			expect({messages}).toContainMessage({
				rule: "no_abs_self_links",
				level: "error",
				location: "model:mixed/view:my_view/dimension:mixed/link",
				description: "Self-links should not be absolute. Found https://my.looker.com/dashboards/2?value={{value}}, https://my.looker.com/dashboards/3?value={{value}}"
			});
		});
	});
});
