view: bad_view {
	dimension: foo {
		sql: TRUE ;;
		html:			
			{% if linkback_type._parameter_value == "Client" %}
			<p>Thank you for logging in!</p>
			<p><a href="https://<redacted>/client/{{ client_id._parameter_value | replace:'$','-' }}">Return to dashboard</a></p>
			{% endif %}
		;;
	}
}