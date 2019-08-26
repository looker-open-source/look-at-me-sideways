const lams = require('../../../index.js')
const createMocks = require('../../../lib/mocks.js')
const options = {reporting:"no"}
const log = x=>console.log(x)

describe('Projects', () => {
	describe('00-basic', () => {
		it("should not error", async ()=> {
			let {spies, process, console} = createMocks()
			let messages = await lams(options,{process, console})
			expect(console.error).not.toHaveBeenCalled()
			log(messages)
		});
	});
});