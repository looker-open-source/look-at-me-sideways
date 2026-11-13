/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const lams = require('../../index.js');
const mocks = require('../../lib/mocks.js');
const {parseFiles} = require('lookml-parser');
const path = require('path');

describe('Rules', () => {
	describe('P', () => {
		it('should pass when project has no errors', () => {
			let result = rule({});
			expect(result).not.toContainMessage({level: 'error'});
		});

		it('should report P0 for PARSE_ERROR and unknown error codes', () => {
			let result = rule({
				errors: [
					{
						code: 'PARSE_ERROR',
						filePath: 'bad.view.lkml',
						message: 'Unexpected parser failure',
					},
					{
						code: 'SOME_UNKNOWN_CODE',
						filePath: 'other.view.lkml',
						message: 'Unknown failure',
					},
				],
			});
			expect(result).toContainMessage({
				rule: 'P0',
				level: 'error',
				location: 'file:bad.view.lkml',
				description: 'Parsing error: Unexpected parser failure',
			});
			expect(result).toContainMessage({
				rule: 'P0',
				level: 'error',
				location: 'file:other.view.lkml',
				description: 'Parsing error: Unknown failure',
			});
		});

		it('should report P1 for SYNTAX_ERROR with context hint', () => {
			let result = rule({
				errors: [
					{
						code: 'SYNTAX_ERROR',
						filePath: 'broken.model.lkml',
						message: 'LookML error in broken.model.lkml:3:1: Expected "}"',
						context: '1: explore: foo {\n2: \tlabel: "Foo"\n3: ',
					},
				],
			});
			expect(result).toContainMessage({
				rule: 'P1',
				level: 'error',
				location: 'file:broken.model.lkml',
				hint: '1: explore: foo {\n2: \tlabel: "Foo"\n3: ',
			});
		});

		it('should report P2 for DUPLICATE_SINGULAR_PROPERTY', () => {
			let result = rule({
				errors: [
					{
						code: 'DUPLICATE_SINGULAR_PROPERTY',
						filePath: 'dup.view.lkml',
						property: 'sql_table_name',
						message: 'Property "sql_table_name" is singular but was declared 2 times.',
					},
				],
			});
			expect(result).toContainMessage({
				rule: 'P2',
				level: 'error',
				location: 'file:dup.view.lkml',
				description: 'Parsing error: Property "sql_table_name" is singular but was declared 2 times.',
			});
		});

		it('should report P3 for INVALID_PROPERTY_TYPE', () => {
			let result = rule({
				errors: [
					{
						code: 'INVALID_PROPERTY_TYPE',
						filePath: 'badtype.view.lkml',
						property: 'hidden',
						message: 'Property "hidden" expects type "boolean", but received string.',
					},
				],
			});
			expect(result).toContainMessage({
				rule: 'P3',
				level: 'error',
				location: 'file:badtype.view.lkml',
				description: 'Parsing error: Property "hidden" expects type "boolean", but received string.',
			});
		});

		it('should report P4 for MISSING_REQUIRED_PROPERTY', () => {
			let result = rule({
				errors: [
					{
						code: 'MISSING_REQUIRED_PROPERTY',
						filePath: 'missing.model.lkml',
						property: 'field',
						message: 'Required property "field" is missing in access_filter.',
					},
				],
			});
			expect(result).toContainMessage({
				rule: 'P4',
				level: 'error',
				location: 'file:missing.model.lkml',
				description: 'Parsing error: Required property "field" is missing in access_filter.',
			});
		});

		it('should surface real lookml-parser validation errors (P1, P2, P3, P4) when opted in', async () => {
			const project = await parseFiles({
				source: '**/*.lkml',
				cwd: path.join(__dirname, 'test-project'),
				fileOutput: 'by-name',
			});
			const result = rule(project);
			expect(result).toContainMessage({rule: 'P1', level: 'error', location: 'file:syntax.view.lkml'});
			expect(result).toContainMessage({rule: 'P2', level: 'error', location: 'file:dup.view.lkml'});
			expect(result).toContainMessage({rule: 'P3', level: 'error', location: 'file:type.view.lkml'});
			expect(result).toContainMessage({rule: 'P4', level: 'error', location: 'file:req.view.lkml'});
		});

		it('should only surface P0 and P1 when running in default-only mode', async () => {
			const project = await parseFiles({
				source: '**/*.lkml',
				cwd: path.join(__dirname, 'test-project'),
				fileOutput: 'by-name',
			});
			const result = rule(project, {_defaultOnly: true});
			expect(result).toContainMessage({rule: 'P1', level: 'error', location: 'file:syntax.view.lkml'});
			expect(result).not.toContainMessage({rule: 'P2', level: 'error'});
			expect(result).not.toContainMessage({rule: 'P3', level: 'error'});
			expect(result).not.toContainMessage({rule: 'P4', level: 'error'});
		});

		it('should filter out sub-rules disabled via manifest (e.g. rule: P3 { enabled: no })', async () => {
			const {process, console} = mocks();
			const messages = await lams({
				cwd: path.join(__dirname, 'test-project'),
				manifest: {rule: {P: {}, P3: {enabled: false}}},
			}, {process, console});
			expect({messages}).toContainMessage({rule: 'P1', level: 'error', location: 'file:syntax.view.lkml'});
			expect({messages}).toContainMessage({rule: 'P2', level: 'error', location: 'file:dup.view.lkml'});
			expect({messages}).not.toContainMessage({rule: 'P3', level: 'error'});
			expect({messages}).toContainMessage({rule: 'P4', level: 'error', location: 'file:req.view.lkml'});
		});

		it('should allow opting in to individual sub-rules (e.g. rule: P2 {}) without enabling all P rules', async () => {
			const {process, console} = mocks();
			const messages = await lams({
				cwd: path.join(__dirname, 'test-project'),
				manifest: {rule: {P2: {}}},
			}, {process, console});
			expect({messages}).toContainMessage({rule: 'P1', level: 'error', location: 'file:syntax.view.lkml'});
			expect({messages}).toContainMessage({rule: 'P2', level: 'error', location: 'file:dup.view.lkml'});
			expect({messages}).not.toContainMessage({rule: 'P3', level: 'error'});
			expect({messages}).not.toContainMessage({rule: 'P4', level: 'error'});
		});
	});
});
