/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
/* Custom matcher for:
expect(rules(project)).toEqual(
	expectObjectContaining({
		messages: expect.arrayContaining([expect.objectContaining(argument)])
	})
);
*/
expect.extend({
	toContainMessage(received, argument) {
		const pass = this.equals(received,
			expect.objectContaining({
				messages: expect.arrayContaining([expect.objectContaining(argument)]),
			})
		);
		if (pass) {
			return {
				message: () => (`expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(argument)}`),
				pass: true,
			};
		} else {
			return {
				message: () => (`expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(argument)}`),
				pass: false,
			};
		}
	},
});
