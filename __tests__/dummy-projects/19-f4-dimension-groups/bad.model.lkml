view: bad {
  dimension_group: created {
    type: time
    sql: ${TABLE}.created_at ;;
    timeframes: [date, week, month, year]
  }
}
