<p>...unless the view declares that it has no primary key via a <code>pk0_</code> named dimension.</p>
<code class="bad block">
	# Missing a primary_key:yes dimension

	view: users {
		sql_table_name: users ;;
	}
	</code>
<code class="good block">
	view: users {
		sql_table_name: users ;;
		dimension: pk1_user_id {
			primary_key: yes
			hidden: yes
			sql: ${TABLE}.user_id ;;
		}
	}
	</code>
<code class="bad block">
	# Too many primary_key:yes dimensions

	view: users {
		sql_table_name: users ;;
		dimension: pk1_user_id {
			primary_key: yes
			hidden: yes
			sql: ${TABLE}.user_id ;;
		}
		dimension: id {
			primary_key: yes
			sql: ${TABLE}.user_id ;;
		}
	}
	</code>
<code class="good block">
	view: log_events {
		sql_table_name: log_events ;;
		dimension: pk0_user_id {
			hidden: yes
		}
	}
	</code>
