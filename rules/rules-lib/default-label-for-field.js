module.exports = function defaultLabelForField(field){
	//Maybe add logic based on yesno type?
	const labelFromName = field.$name
		.split("_")
		.filter(Boolean)
		.map(word => word.slice(0,1).toUpperCase() + word.slice(1))
		.join(" ")
	return labelFromName
}
