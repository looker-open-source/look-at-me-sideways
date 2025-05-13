access_grant: can_see_revenue_mnpi {
  user_attribute: can_see_revenue_mnpi
  allowed_values: ["Yes,No"] #This is the value for users with access. The ones without access have "No"
}

view: mnpi_access_control {
  fields_hidden_by_default: yes
  derived_table: {
    sql: select date as event_date, case
          when date between '2019-01-01' and '2024-09-30' then date('2024-10-29')
          when date between '2024-10-01' and '2024-12-31' then date('2025-02-13')
          else date('2050-01-01') end as public_date
         FROM UNNEST(GENERATE_DATE_ARRAY('2019-01-01', '2034-12-31', INTERVAL 1 DAY)) AS Date
          ;;
  }
  dimension: event_date {
    type: date
    datatype: date
    sql: ${TABLE}.event_date ;;
  }
  dimension: public_date {
    type: date
    datatype: date
    sql: ${TABLE}.public_date ;;
  }
  dimension_group: current_pacific {
    description: "Pacific/Los Angeles"
    convert_tz: no
    type: time
    sql: current_datetime("America/Los_Angeles") ;;
    datatype: datetime
    timeframes: [raw,time,date,week,month,quarter,year]
  }

  dimension: is_public {
    type: yesno
    sql: ${current_pacific_date} >= ${mnpi_access_control.public_date} ;;
  }

  dimension: is_mnpi { #designed so that user attribute "can see MNPI" = 'Yes,No' will show all data, and "can see MNPI" = No will see only public data
    type: yesno
    sql: NOT ${is_public} ;;
  }
}

