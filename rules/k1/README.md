<p>..., where n is the total number of columns that form the primary key, and which may be omitted if it is 1, and key_name is any descriptive name.</p>

<p><b>Note:</b> This applies to "regular" views that describe an underlying table, i.e. through a <code>sql_table_name</code>, <code>derived_table</code>, or implicit table name. In some cases, you may have a "field-only view", which would be joined using `<code>join: {sql: ;;}</code>`, for which this rule would not apply.</p>

<p><b>Rationale:</b> With this naming convention, anyone creating a join can conclusively find the correct logic without having to investigate:</p>

<img src="img/pk-dimension-suggested.png" width="381" height="117" />

<p>Additionally, anyone reading the join could conclusively verify it. </p>

<code class="bad block">
view: carriers {
	sql_table_name: faa.carriers ;;
	dimension: carrier_id {
		hidden: yes
		primary_key: yes
		sql:${TABLE}.id;;
	}
}
# ^ Altough `primary_key: yes` is used, the 
# naming convention has not been followed

explore: flights {
	join: carriers {
		relationship: many_to_one
		sql_on: ${carriers.carrier_id}
				= ${flights.carrier_id} ;;

		# ^ is this logic right? I
		# would need to inspect the
		# view definition to confirm
	}
}
  	</code>

<code class="block good">
view: carriers {
	sql_table_name: faa.carriers ;;
	dimension: pk1_carrier_id {
		hidden: yes
		primary_key: yes
		sql:${TABLE}.id;;
	}
}

explore: flights {
	join: carriers {
		relationship: many_to_one
		sql_on: ${carriers.pk1_carrier_id}
				= ${flights.carrier_id} ;;
		  
		# ^ I know the join cardinality 
		# must be correct because I see it's
		# joining on the primary key
	}
}
  	</code>

<code class="block good">
# Example of a composite primary key
view: membership {
	sql_table_name: membership ;;
	dimension: pk2_user_id {
		hidden:yes
		sql:${TABLE}.user_id;;
	}
	dimension: pk2_group_id {
		hidden:yes
		sql:${TABLE}.group_id;;
	}
	dimension: user_x_group {
		hidden:yes
		primary_key: yes
		sql: ${pk2_user_id} || 'x' || ${pk2_group_id} ;;
	}
}

explore: invitations {
	join: membership {
	relationship: many_to_one
	sql_on: ${membership.pk2_user_id}
			= ${invitations.to_user_id}
		AND ${membership.pk2_group_id}
			= ${invitations.group_id} ;;
	# ^ I can tell there MUST be only one membership
	# for each row from the left table. Looks good.
	}
}

explore: users {
	join: membership {
	relationship: many_to_one
	sql_on: ${membership.pk2_user_id} = ${users.id} ;;

	# ^ Without even examining the view, I can
	# tell that something is wrong here!
	# (And rule E2 can check this for me)
	}
}
</code>

<h5>Notes</h5>

<ul>
<li> The number can (and must) be 0 in the rare case that you are working with a table with no primary key.</li>
<li> The name should be descriptive outside of the context of the view. So, prefer <code>pk1_account_id</code> over <code>pk1_id</code>. This way, views that logically share one or more primary keys can be recognized.</li>
<li> For keys with more than one column, all the numbers should be equal to the total number of columns. So, <code>pk3_a</code>, <code>pk3_b</code>, and <code>pk3_c</code>, NOT <code>pk1_a</code>, <code>pk1_b</code>, and <code>pk1_c</code>.</li>
<li> For keys with more than one column, this does mean you would need to define it in two ways. Once this way, and once as a single concatenated dimension with <code>primary_key: yes</code> (if necessary) so Looker can use it for generating symmetric aggregates. This is a small price to pay for the many instances of time saved looking up primary key information when writing/reading explores.</li>
<li> An earlier version of these guidelines specified a naming convention starting with <code>{n}pk</code>. This has been changed to reflect the fact that many databases do not allow column names to start with a number.</li>
</ul>
