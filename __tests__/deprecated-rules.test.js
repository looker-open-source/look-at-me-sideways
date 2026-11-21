/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const fs = require('fs');
const path = require('path');

describe('Deprecated rule identifiers', () => {
	it('should never be reused by any active rule, meta.json id, or sub-rule', () => {
		const rulesDir = path.resolve(__dirname, '..', 'rules');
		const deprecated = JSON.parse(
			fs.readFileSync(path.join(rulesDir, 'deprecated.json'), 'utf8'),
		);
		const deprecatedIds = new Set(deprecated.map((r) => String(r.id).toLowerCase()));

		const entries = fs.readdirSync(rulesDir, {withFileTypes: true})
			.filter((d) => d.isDirectory());

		for (const dir of entries) {
			expect(deprecatedIds.has(dir.name.toLowerCase())).toBe(false);
			const metaPath = path.join(rulesDir, dir.name, 'meta.json');
			if (fs.existsSync(metaPath)) {
				const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
				if (meta.id) {
					expect(deprecatedIds.has(String(meta.id).toLowerCase())).toBe(false);
				}
				if (Array.isArray(meta.subRules)) {
					for (const sub of meta.subRules) {
						expect(deprecatedIds.has(String(sub).toLowerCase())).toBe(false);
					}
				}
			}
		}
	});
});
