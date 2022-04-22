view: my_view {
	dimension: bad {
		link: {
			label: "Bad Dashboard Link"
			url: "https://my.looker.com/dashboards/1?value={{value}}"
		}	
	}
	dimension: mixed {
		link: {
			label: "Ok Dashboard Link"
			url: "/dashboards/1?value={{value}}"
		}
		link: {
			label: "Bad Dashboard Link"
			url: "https://my.looker.com/dashboards/2?value={{value}}"
		}		
		link: {
			label: "Also Bad Dashboard Link"
			url: "https://my.looker.com/dashboards/3?value={{value}}"
		}		
	}
	dimension: ok {
		link: {
			label: "Ok (extraneous) Dashboard Link"
			url: "https://anotherapp.com/route?value={{value}}"
		}
	}
}
