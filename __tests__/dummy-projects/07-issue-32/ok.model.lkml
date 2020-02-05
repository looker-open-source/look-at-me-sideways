view: ok_view {
	dimension: foo {
		sql: ${actual.cross_view_reference} ;;
		html:			
			{% if linkback_type._parameter_value == "Client" %}
			<p>Thank you for logging in!</p>
			<p><a href="https://<redacted>/client/{{ client_id._parameter_value | replace:'$','-' }}">Return to dashboard</a></p>
			{% endif %}
		;;
	}
}