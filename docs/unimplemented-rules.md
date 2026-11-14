# Unimplemented Style Guide Rules

These rules were previously listed in `docs/rules.html` (marked with 💬 or commented out as drafts) without linter implementations. They have been collected here for review to decide whether to implement or drop each rule.
## K5

<details id="k5"> <!-- Distribution dimensions -->
	<summary><b><a href="#k5">K5.</a></b> Views based on tables with a <a class="subtle" href="#glossary-dist-key">distribution key</a> should define a Distribution Key Dimension... <a href="#not-implemented">💬</a></summary>
	<p>...named like <code>pkd_{key_name}</code></p>
	<p><b>Rationale:</b> By naming it similarly to Primary Keys, it will be suggested to anyone joining on a view as a possible join key. At the same time, the use of a `d` instead of a number allows it to be differentiated from a primary key</p>
	<p><b>Note:</b> If your database supports multiple projections of data, you may want to come up with a more sophisticated naming scheme instead.</p>
	</details>

## K6

<details id="k6"> <!-- Sort/cluster dimensions -->
	<summary><b><a href="#k6">K6.</a></b> Views based on tables with a <a class="subtle" href="#glossary-sort-key">sort/cluster key</a> should define one or more Sort/Cluster Key Dimensions <a href="#not-implemented">💬</a></summary>
	<p>...named like <code>pkc_{key_name}</code></p>
	<p><b>Rationale:</b> By naming it similarly to Primary Keys, it will be suggested to anyone joining on a view as a possible join key. At the same time, the use of a `c` instead of a number allows it to be differentiated from a primary key</p>
	<p><b>Note:</b> The name for this concept varies greatly from database to database. "pkc" was chosen for cluster, in favor of "pks" which could be read as a "surrogate key".</p>
	<p><b>Note:</b> If you have compound cluster/sort keys, it would be a good idea to include the rank of each column in the dimension name. Unlike the PK naming convention, each column should get a different numner, e.g. <code>pkc1_site, pkc2_date, pkc3_country</code>.</p>
	</details>

## T11

<details id="t11"><!-- Asserted uniques -->
	<summary><b><a href="#t11">T11.</a></b> Aggregates which should produce a single value should be asserted <a href="#not-implemented">💬</a></summary>
	<p><b>Rationale:</b> Rather than trusting/hoping the data will be what you want, we can ensure it and prevent bad data from propagating upstream</p>
	<code class="block good">
		--BigQuery - More convenient syntax
		SELECT
			user_guid as pk1_user_guid,
			---
			COUNT(*) as events,
			CASE WHEN MIN(account_id) &lt;> MAX(account_id)
				THEN ERROR("Non-unique violation in view foo on column account_id for user_guid " || user_guid)
				ELSE MIN(account_id)
				END AS account_id
		FROM events
		GROUP BY user_guid
	</code>
	<p><b>Note:</b> In a dialect where dividing by zero throws an error, this is a good approach. If done in a PDT, the building of the new PDT will fail.</p>
	<code class="block good">
		-- If division by zero throws for your syntax
		SELECT
			user_guid as pk1_user_guid,
			---
			COUNT(*) as events,
			MIN(account_id)
				||SUBSTR('',0 / CASE WHEN MIN(account_id) &lt;> MAX(account_id) THEN 0 ELSE 1 END)
				^Concat a zero length string for string types, or add 0 for integer types
				AS account_id
		FROM events
		GROUP BY user_guid
	</code>
	</details>

## T12

<details id="t12"><!-- No order by-->
	<summary><b><a href="#t12">T12.</a></b> Queries should not have an ORDER BY clause <a href="#not-implemented">💬</a></summary>
		<p>...unless a limit is also used (which should itself be unusual)</p>
		<p><b>Rationale:</b> We often order data when querying directly, but make sure to remove this ORDER BY clause when saving the query as a derived table, as the sort order does not ultimately affect the table, but does cause the query to use more resources.</p>
	</details>
