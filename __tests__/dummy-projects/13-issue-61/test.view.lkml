view: users {
  sql_table_name: users ;;
  
  dimension: pk1_user_id {
    hidden: yes
    primary_key: yes
    description: "Primary key for users"
    sql: ${TABLE}.id ;;
  }

  dimension: id {
    description: "The unique identifier for a user"
    sql: ${TABLE}.id ;;
  }

  set: detail {
    fields: [
      id,
      #name,
    ]
  }

}