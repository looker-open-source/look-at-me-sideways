const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const options = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)

describe('Projects', () => {
	describe('01-subdirectories', () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console})
		})
		it("should not error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("it should error on rule K1 for view:sub1", ()=> {
			expect({messages}).toContainMessage({
				rule:"K1",
				level:"error",
				location: 'view: sub1',
				path: '/projects/01-subdirectories/files/sub1/sub1.view.lkml#view:sub1'
			});
		});
		it("it should error on rule K2 for view:sub2", ()=> {
			expect({messages}).toContainMessage({
				rule:"K2",
				level:"error",
				location: 'view: sub2',
				path: '/projects/01-subdirectories/files/sub1/sub2/sub2.view.lkml#view:sub2'
			});
		});
		it("it should error on rule E2 for model:top/explore:sub2", ()=> {
			expect({messages}).toContainMessage({
				rule:"E2",
				level:"error",
				location: 'model:top/explore:sub2/join:junk'
			});
		});
		it("it should error on rule E2 for model:sub1/explore:sub2", ()=> {
			expect({messages}).toContainMessage({
				rule:"E2",
				level:"error",
				location: 'model:sub1/explore:sub2/join:junk'
			});
		});
	});
});