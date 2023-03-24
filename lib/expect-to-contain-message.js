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
			}),
		);
		if (pass) {
			return {
				message: () => (
					`expected messages: \n\t`
					+ ((received||{}).messages||[]).sort(messageSorting).map((msg)=>this.utils.printReceived(msg)).join('\n\t')
					+`\nNOT to contain \n\t`
					+ this.utils.printExpected(argument)
				),
				pass: true,
			};
		} else {
			return {
				message: () => (
					`expected messages: \n\t`
					+ ((received||{}).messages||[]).sort(messageSorting).map((msg)=>this.utils.printReceived(msg)).join('\n\t')
					+`\nto contain \n\t`
					+ this.utils.printExpected(argument)
				),
				pass: false,
			};
		}
	},
});

function messageSorting(a, b) {
	return (a.rule||'').localeCompare(b.rule||'');
}
