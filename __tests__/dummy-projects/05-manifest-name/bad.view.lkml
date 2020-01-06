view: bad {
	measure:bad {
		type: count
		# Should specify a filter to comply with rule F3
	}
	measure:bad_exempted {
		type: count
		description: "foo"
		# Should specify a filter to comply with rule F3
		# LAMS
		# rule_exemptions: {
		#  F3: "2000-01-01: This is exempted because xyz"
		# }
	}
	measure:another_bad_exempted {
		type: count
		# Should specify a filter to comply with rule F3
		# LAMS
		# rule_exemptions: {
		#  F3: "2000-02-01: This is exempted because abc"
		#  F4: "2000-02-01: This is exempted because def"
		# }
	}
}
