module.exports = manifestMergeMutate

function manifestMergeMutate(target, toAdd){
	const ruleMerge = 
		!target.rule && !toAdd.rule ? {} :
		{
			rule: {
				...(target.rule||{}),
				...(toAdd.rule||{})
			}
		};
	Object.assign(target, toAdd);
	Object.assign(target, ruleMerge);
	return target;
}