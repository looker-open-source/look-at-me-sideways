/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e2-1.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E2.1', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let e2_1 = {rule: 'E2.1'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 0 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 0 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 0 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass for joins without foreign_key', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 0 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass for *_to_many joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: order_items {
						foreign_key: order_id
						relationship: one_to_many
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses a 1pk foreign key', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						foreign_key: pk1_user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses an implicit 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						foreign_key: pk_user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 0 errors"
			});
			expect(result).not.toContainMessage(error);
		});

		it('should error if a many_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});

		it('should error if a many_to_one foreign_key join uses a PK dimensions of non-1 size', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						foreign_key: pk2_user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});

		it('should error if a one_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: one_to_one
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});

		it('should error if a many_to_one foreign_key join uses a PK dimensions of non-1 size', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: one_to_one
						foreign_key: pk2_user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});

		it('should error if an unspecified cardinality (implicitly many_to_one) join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});

		it('should error if an unspecified cardinality (implicitly many_to_one) foreign_key join uses a PK dimensions of non-1 size', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						foreign_key: pk2_user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e2_1, ...info,
				description: "Rule E2.1 summary: 1 matches, 0 matches exempt, and 1 errors"
			});
			expect(result).toContainMessage({...e2_1, ...error});
		});
	});
});
