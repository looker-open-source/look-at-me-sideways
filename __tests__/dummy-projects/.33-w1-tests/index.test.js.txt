let {testName, lams, options, mocks} = require('../../../lib/test-commons.js')(__dirname,{dirnameOffset:-1})
 
options = {...options, manifest:`./manifest.lkml`}

describe('Projects', () => {
	describe(testName, () => {
		let {spies, process, console} = mocks()
		let messages
		beforeAll( async () => {
			messages = await lams(options,{process, console});
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

		it("it should not error for 01_good.view", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "W1",
				level: "error",
				file:"01-good.view/view:01_good/dimension:bar"
			});
		});

		it("it should error for 02_bad.view", ()=> {
			expect({messages}).toContainMessage({
				rule: "W1",
				level: "error",
				location: "file:02-bad.view/view:01_good/dimension:bar"
			});
		});


		it("it should not error for 03-old-cc-indented-nospace.view", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "W1",
				level: "error",
				location:"file:03-old-cc-indented-nospace.view/view:foo"
			});
		});

		it("it should not error for 04-new-cc-indented-space.view", ()=> {
			expect({messages}).not.toContainMessage({
				rule: "W1",
				level: "error",
				location:"file:04-new-cc-indented-space.view/view:foo"
			});
		});

	});
});
