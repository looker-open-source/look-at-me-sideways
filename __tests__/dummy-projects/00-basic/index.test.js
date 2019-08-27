const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const options = {reporting:"no", cwd:__dirname}

describe('Projects', () => {
	describe('00-basic', () => {
		it("should not error", async ()=> {
			let {spies, process, console} = mocks()
			let messages = await lams(options,{process, console})
			expect(console.error).not.toHaveBeenCalled()
			expect(process.exit).not.toHaveBeenCalled()
		});
	});
});