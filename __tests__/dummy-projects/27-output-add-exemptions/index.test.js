const lams = require('../../../index.js')
const mocks = require('../../../lib/mocks.js')
const path= require('path')
const defaultTestingOptions = {reporting:"no", cwd:__dirname}
require('../../../lib/expect-to-contain-message');
const log = x=>console.log(x)
const testProjectName = __dirname.split(path.sep).slice(-1)[0];
const fs = require("node:fs/promises")
const expectedOutput = '{"rule":"K1","location":"model:test/view:bad"}\n';
describe('Projects', () => {
	describe(testProjectName, () => {
		let {spies, process, console} = mocks()
		let messages1, messages2, output1, output2
		beforeAll( async () => {
			const options = {
				...defaultTestingOptions,
				output: "add-exemptions"
			}
			const outputPath = path.resolve(__dirname,"lams-exemptions.ndjson")
			try{await fs.rm(outputPath, {force:true})}catch(e){}
			messages1 = {messages: await lams(options,{process, console})}
			output1 = await fs.readFile(outputPath,{encoding:"utf8"})
			messages2 = {messages: await lams(options,{process, console})}
			output2 = await fs.readFile(outputPath,{encoding:"utf8"})
		})
		it("should not error out", ()=> {
			expect(console.error).not.toHaveBeenCalled()
		});
		it("it should not contain any unexpected parser (P0) errors", ()=> {
			expect(messages1).not.toContainMessage({
				rule: "P0",
				level: "error"
			});
			expect(messages2).not.toContainMessage({
				rule: "P0",
				level: "error"
			});
		});
		it("it should not contain any parser syntax (P1) errors", ()=> {
			expect(messages1).not.toContainMessage({
				rule: "P1",
				level: "error"
			});
			expect(messages2).not.toContainMessage({
				rule: "P1",
				level: "error"
			});
		});

		it("run 1 should match K1 (1 match, 0 exempt, 1 error)", ()=> {
			expect(messages1).toContainMessage({
				rule: "K1",
				level: "info",
				description: "Rule K1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
		});

		it("run 1 should error on K1", ()=> {
			expect(messages1).toContainMessage({
				rule: "K1",
				level: "error"
			});
		});

		it("run 1 should output the expected ndjson", ()=> {
			expect(output1).toEqual(expectedOutput);
		});

		it("run 2 should match K1 (1 match, 1 exempt, 0 errors)", ()=> {
			expect(messages2).toContainMessage({
				rule: "K1",
				level: "info",
				description: "Rule K1 summary: 1 matches, 1 matches exempt, and 0 errors"
			});
		});

		it("run 2 not should error on K1", ()=> {
			expect(messages2).not.toContainMessage({
				rule: "K1",
				level: "error"
			});
		});

		it("run 2 should output the (same) expected ndjson", ()=> {
			expect(output2).toEqual(expectedOutput);
		});


	});
});
