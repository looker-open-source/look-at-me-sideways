<p><b>Rationale:</b> Primary keys define a contract that allows anyone reviewing the logic of a query to evaluate it modularly.
Without them, any attempt to troubleshoot a query requires an arbitrarily deep investigation of related subqueries.
With them, each query and subquery can be evaluated independently against their declared PK and the declared PK's of the participating tables.</p>

<code class="good block">
view: user_lifetime {derived_table: {sql:
	SELECT
		user_id as pk1_user_id
		---
		COUNT(*) as lifetime_orders,
		SUM(amount) as lifetime_spend
	FROM orders
	GROUP BY user_id ;;}
</code>

<code class="bad block">
view: user_lifetime {derived_table: {sql:
	SELECT
		user_id,
		COUNT(*) as lifetime_orders,
		SUM(amount) as lifetime_spend
	FROM orders
	GROUP BY 1 ;;}
</code>

<code class="bad block">
derived_table: {sql:
	WITH orders AS (
		SELECT order_id, SUM(amount) FROM order_items
		GROUP BY 1
	)
	-- ^ The rule applies to CTE's/subqueries as well
	SELECT
		user_id as pk1_user_id
		---
		COUNT(*) as lifetime_orders,
		SUM(amount) as lifetime_spend
	FROM orders
	GROUP BY user_id ;;}
</code>

<details id="t2.1"> <!-- Primary key naming -->
	<summary><b><a href="#t2.1">T2.1.</a></b> Primary key columns should be aliased AS pk{n}_{column_name}...</summary>
	<p>...where {n} is the total number of columns in the primary key</p>
	<code class="good block">
	view: events_rollup {derived_table: {sql:
		SELECT
			site as pk2_site,
			date as pk2_date,
			---
			COUNT(*) as events
		FROM events
		GROUP BY site,date ;;}
	</code>
	<p><b>Note:</b> If you are using _in_query to generate a dynamic derived table where a column may or may not be present in the derived table's primary key, you should always select a static number of PK columns and conditionally NULL out their values, rather than selecting a dynamic number of columns.</p>

	<code class="bad block">
	view: dynamic_events_rollup {derived_table: {sql:
		SELECT
			site as pk2_site,
			{% if date.date._in_query %} date as pk2_date, {% endif %}
			---
			COUNT(*) as events
		FROM events
		GROUP BY site,date ;;}
	</code>
	<code class="good block">
	view: dynamic_events_rollup {derived_table: {sql:
		SELECT
			site as pk2_site,
			{% if date.date._in_query %} date
			{% else %} NULL
			{% endif %} as pk2_date,
			---
			COUNT(*) as events
		FROM events
		GROUP BY site,date ;;}
	</code>
	</details>
<details id="t2.2"> <!-- Primary key positioning -->
	<summary><b><a href="#t2.2">T2.2.</a></b> Primary key columns should be the first columns in the SELECT clause</summary>
	<code class="bad block">
	derived_table: {sql:
		SELECT
			COUNT (*) as order_count,
			user_id as pk1_user_id
		FROM orders
		GROUP BY user_id ;;}
	</code>
	</details>
<details id="t2.3"> <!-- Grouped PK starts... -->
	<summary><b><a href="#t2.3">T2.3.</a></b> For grouped queries, the PK should start with one, more, or all of the grouped columns</summary>
	<h5>Notes</h5>
	<ul>
	<li>In most cases, unless you <i>intend</i> to use a window function to create sequence numbers within a partition, the primary key should simply be ALL of the grouped by fields.</li>
	<li>If you want to join a derived table on only a subset of its columns, what you probably want is to groups by ONLY those columns and then aggregate the rest (see example below)</li>
	</ul>
	<code class="block bad">
	view: instance_daily {derived_table: {sql:
	SELECT
		events.instance_id as pk2_instance_id,
		events.event_date as pk2_event_date,
		---
		events.app_version,
		COUNT(*) as events
	FROM events
	GROUP BY 1,2,3
	;;}}
	</code>

	<code class="block questionable">
	view: instance_daily {derived_table: {sql:
	SELECT
		events.instance_id as pk3_instance_id,
		events.event_date as pk3_event_date,
		events.app_version as pk3_app_version,
		---
		COUNT(*) as events
	FROM events
	GROUP BY 1,2,3
	;;}}
	</code>

	<code class="block questionable">
	view: instance_daily {derived_table: {sql:
	SELECT
		events.instance_id as pk3_instance_id,
		events.event_date as pk3_event_date,
		ROW_NUMBER() OVER (
			PARTITION BY events.instance_id, events.event_date
		) as pk3_app_version_sequence
		---
		events.app_version,
		COUNT(*) as events
	FROM events
	GROUP BY 1,2
	;;}}
	</code>

	<p>Although the above two "questionable" examples satisfy rules T4 & T6, you will likely find that it is not natural to join them on their entire primary key when you try to use them elsewhere. </p>

	<code class="block good">
	view: instance_daily {derived_table: {sql:
	SELECT
		events.instance_id as pk2_instance_id,
		events.event_date as pk2_event_date,
		---
		MAX(events.app_version) as app_version,
		-- Maybe min too depending on business logic
		COUNT(*) as events
	FROM events
	GROUP BY 1,2
	</code>

	</details>
<details id="t2.4"> <!-- Ungrouped PK starts... -->
	<summary><b><a href="#t2.4">T2.4.</a></b> For ungrouped queries, the PK should start with one, more, or all of the PK's from the many-joined tables</summary>
	<p><b>Note:</b> This rule requires some reasoning to evaluate, but with proper PK information, can be done within the context of the current query. For example, the 1-to-1 full outer join example coalesces the PK's from the two sides of the join to come up with the effective primary key of the join.</p>
	<code class="good block">
	SELECT
		sites.pk1_id as pk2_site_id,
		dates.pk1_date as pk2_date,
		---
		daily_rollup.count
	FROM sites
	CROSS JOIN dates
	LEFT JOIN daily_rollup
	  ON  daily_rollup.pk2_site_id = sites.pk2_id,
	  AND daily_rollup.pk2_site_id = sites.pk2_id
	</code>
	<code class="good block">
	SELECT
		sessions.pk1_id as pk1_session_id,
		---
		sites.name,
		dates.is_holiday
	FROM sites
	CROSS JOIN dates
	INNER JOIN sessions
	  ON  sessions.date = sites.pk1_id,
	  AND sessions.site_id = dates.pk1_id
	</code>
	<code class="good block">
	SELECT
		COALESCE(
		  historical.pk2_site_id,
		  incremental.pk2_site_id
		) as pk2_site_id,
		COALESCE(
		  historical.pk2_date,
		  incremental.pk2_date
		) as pk2_date
		---
		COALESCE(
		  incremental.count
		  historical.count,
		) as count
	FROM historical
	FULL OUTER JOIN incremental
	  ON  incremental.pk2_site_id = historical.pk2_site_id,
	  AND incremental.pk2_date = historical.pk2_date
	</code>
	</details>
<details id="t2.5"> <!-- PK continues with window -->
	<summary><b><a href="#t2.5">T2.5.</a></b> The PK should continue with a ROW_NUMBER, if...</summary>
	<p>... T5/T6 did not use ALL available columns. The window function should have a PARTITION BY of the preceding PK columns (at least one required)</p>
	<p><b>Note:</b> Actually, any window function that produces unique values for each row is acceptable, but this is almost always <code>ROW_NUMBER()</code>.
	Make sure not to use a <code>RANK</code>-like window function instead of <code>ROW_NUMBER</code>. The former yields duplicate ranks when two rows match. (For example, "Monday, Monday, Tuesday" would have ranks of 1,1,3)</p>
	<code class="good block">
	SELECT
		user_id as pk2_user_id,
		ROW_NUMBER() OVER (
			PARTITION BY user_id
			ORDER BY id ASC
		) as pk2_order_sequence_number,
		---
		id as order_id
	GROUP BY 1,2
	</code>
	<code class="bad block">
	SELECT
		ROW_NUMBER() as pk1_id,
		---
		*
	FROM (
		SELECT site, date, source, count(*) as session_count
		FROM sessions
		GROUP BY 1,2,3,4
	)
	</code>
	<p>I only mention the above example because I've actually seen it used. The primary key for this is simply site,date,source. The ROW_NUMBER added as an afterthough is not a primary key. (In this ruleset, it is disallowed by rules T5/T6 which require one or more columns to precede the window function, if any)</p>
	</details>
<details id="t2.6"> <!-- PK ends with - - - -->
	<summary><b><a href="#t2.6">T2.6.</a></b> Primary key columns end with "---" on its own line</summary>
	<code class="good block">
	view: user_lifetime {derived_table: {sql:
		SELECT
			user_id as pk1_user_id
			---
			COUNT(*) as lifetime_orders,
			SUM(amount) as lifetime_spend
		FROM orders
		GROUP BY user_id ;;}
	</code>
	<p><b>Note:</b> This does not strictly need to immediately follow the columns required by rules T5 - T7. After, such columns, the PK may continue with 0, 1, or more aggregates, but this is rare, and in most cases such aggregates would not need to be in a primary key.</p>
	</details>
<details id="t2.7"> <!-- SELECT 1 col allowed -->
	<summary><b><a href="#t2.7">T2.7.</a></b> Exception - Subqueries may SELECT a single column without declaring PKs</summary>
	<p><b>Rationale:</b> Often, short subqueries are desired for existence or scalar logic that are (a) not reused outside of the current query, and (b) simple enough to read and understand that they can be analyzed in the context of the containing query with little added complexity</p>
	<code class="good block">
	view: new_orders {derived_table:{sql:
	SELECT
		pk1_order_id
	FROM orders
	WHERE order_date > (SELECT MAX(order_date) FROM order_rollup)
					 -- ^ This single-column subquery is exempt
	;;}}
	</code>
	<code class="good block">
	view: pending_users {derived_table:{sql:
	SELECT
		pk1_user_id
	FROM users
	WHERE id IN (SELECT user_id FROM orders WHERE status='Pending')
	           -- ^ This single-column subquery is exempt
	;;}}
	</code>

	</details>
<details id="t2.8"><!-- SELECT * from one table allowed -->
	<summary><b><a href="#t2.8">T2.8.</a></b> Exception - Queries may SELECT &#42;, plus any non-PK columns, FROM a single table/subquery</summary>
	<p><b>Rationale:</b> Since this style of query/subquery simply passes on the PK attributes of the referenced table/query, it's reasonable to save time writing this query and for readers of your query to go find that PK information in that single other table/query.</p>
	<code class="good block">
	view: customers {derived_table: {sql:
		SELECT *
		FROM ${accounts.SQL_TABLE_NAME}
		WHERE is_customer = TRUE
	;;}}
	</code>
	<p>
	</details>
