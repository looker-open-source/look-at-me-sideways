module.exports = function pkNamingConvention(dimension){
	return dimension.$name.match(/^([0-9]+pk|pk[0-9]*)_([a-z0-9A-Z_]+)$/)
}
