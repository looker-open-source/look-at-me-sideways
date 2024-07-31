- dashboard: user_segments
  title: User segments
  layout: newspaper
  embed_style:
    background_color: "#ff4141"
    show_title: false
    title_color: "#3a4245"
    show_filters_bar: true
    tile_text_color: "#3a4245"
    text_tile_text_color: "#caff37"
  elements:
  - name: User segments
    title: User segments
    model: thelook
    explore: users
    type: looker_pie
    fields:
    - users.gender
    - users.count
    filters:
      users.state: ''
    sorts:
    - users.count desc
    limit: 500
    column_limit: 50
    query_timezone: America/Los_Angeles
    value_labels: legend
    label_type: labPer
    stacking: ''
    show_value_labels: false
    label_density: 25
    legend_position: center
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: true
    limit_displayed_rows: false
    y_axis_combined: true
    show_y_axis_labels: true
    show_y_axis_ticks: true
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    show_x_axis_ticks: true
    x_axis_scale: auto
    y_axis_scale_mode: linear
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    series_types: {}
    listen:
      State: users.state
    row: 0
    col: 0
    width: 12
    height: 8
  - name: Markdown
    type: text
    title_text: Markdown
    body_text: "Inline-style: \n![alt text](https://wwwstatic-a.lookercdn.com/homepage/new_home/looker.svg)\n\
      \nReference-style: \n![alt text][logo]\n\n[logo]: https://wwwstatic-a.lookercdn.com/homepage/new_home/looker.svg"
    row: 0
    col: 12
    width: 12
    height: 6
  - name: Md
    type: text
    title_text: Md
    body_text: "Inline-style: \n![alt text](https://wwwstatic-a.lookercdn.com/homepage/new_home/looker.svg)\n\
      \nReference-style: \n![alt text][logo]\n\n[logo]: https://wwwstatic-a.lookercdn.com/homepage/new_home/looker.svg"
    row: 8
    col: 0
    width: 24
    height: 8
  filters:
  - name: State
    title: State
    type: field_filter
    default_value:
    model: thelook
    explore: orderss
    field: users.state
    listens_to_filters: []
    allow_multiple_values: true
    required: false
  - name: City
    title: City
    type: field_filter
    default_value: ''
    model: thelook
    explore: orders
    field: users.city
    listens_to_filters:
    - State
    allow_multiple_values: true
    required: false
