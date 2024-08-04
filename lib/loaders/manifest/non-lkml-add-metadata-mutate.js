module.exports = nonLkmlAddMetadataMutate

function nonLkmlAddMetadataMutate(declarationSet){
	//For now, we only need to go one level-deep, but in the future this could be recursive
	const recognizedTypes = ["rule"]
	for(let type of recognizedTypes){
		if(declarationSet[type]){
			for(let name in declarationSet[type]){
				let value = declarationSet[type][name]
				if(typeof value === "object"){
					value.$type = type;
					value.$name = name;
				}
			}
		}
	}
	return declarationSet
}