const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const options = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0]

const K1 = {rule: "K1"}
const E2 = {rule: "E2"}
const error = {level: "error"}

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
		it("it should error on rule K1 for model:top/view:sub1", ()=> {
			expect({messages}).toContainMessage({...K1, ...error, location: 'model:top/view:sub1'});
		});
		it("it should error on rule K1 for model:sub1/view:sub2", ()=> {
			expect({messages}).toContainMessage({...K1, ...error, location: 'model:sub1/view:sub2'});
		});
		it("it should error on rule E2 for model:top/explore:sub2", ()=> {
			expect({messages}).toContainMessage({
				...E2, ...error,
				location: 'model:top/explore:sub2/join:junk'
			});
		});
		it("it should error on rule E2 for model:sub1/explore:sub2", ()=> {
			expect({messages}).toContainMessage({
				...E2, ...error,
				location: 'model:sub1/explore:sub2/join:junk'
			});
		});
	});
});