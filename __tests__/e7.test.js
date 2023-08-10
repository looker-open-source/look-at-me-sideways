/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e7.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E7', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let e7 = {rule: 'E7'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass concise un-labeled explore names', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail long un-labeled explore names', () => {
			let result = rule(parse(`model: m {
				explore: datawarehouse_bigquery__schema_business__datamart_ecommerce__facts__orders {}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e7, ...error});
		});

		it('should pass concise explore labels', () => {
			let result = rule(parse(`model: m {
				explore: orders {label: "All Orders"}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail long explore labels', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					label:"Data Warehouse: BigQuery > Schema: Business > Datamart: eCommerce > Facts > Orders"
				}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e7, ...error});
		});

		it('should pass long explore names with concise labels', () => {
			let result = rule(parse(`model: m {
				explore: datawarehouse_bigquery_schema_business_datamart_ecommerce__facts__orders {
					label: "All Orders"
				}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail concise un-labeled explore names, if optional maxLength is shorter', () => {
			let result = rule(parse(`
			manifest: {rule: E7 {options: {maxLength: 5}}}
			model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e7, ...error});
		});

		it('should pass long un-labeled explore names, if optional maxLength is longer', () => {
			let result = rule(parse(`
			manifest: {rule: E7 {options: {maxLength: 75}}}
			model: m {
				explore: datawarehouse_bigquery__schema_business__datamart_ecommerce__facts__orders {}
			}`));
			expect(result).toContainMessage({...e7, ...info,
				description: 'Rule E7 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});
	});
});
