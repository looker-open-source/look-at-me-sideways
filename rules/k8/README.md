<p>In the case of a simple, 1-column primary key, this simply means the Primary Key Dimension and the <code>primary_key:yes</code> dimension are the same dimension</p>

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
<p>However, for composite primary keys, you should ensure that the <code>primary_key:yes</code> dimension uses all of the Primary Key Dimensions in its <code>sql</code>:</p>

<code class="good block">
	view: memberships {
		sql_table_name: memberships ;;
		dimension: pk2_user_id {
			hidden: yes
			sql: ${TABLE}.user_id ;;
		}
		dimension: pk2_group_id {
			hidden: yes
			sql: ${TABLE}.group_id ;;
		}
		dimension: membership_id {
			hidden: yes
			primary_key: yes
			sql: ${pk2_user_id} || "-" || ${pk2_group_id} ;;
		}
	}
	</code>
