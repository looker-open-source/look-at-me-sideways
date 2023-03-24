module.exports = function deepGet(object, path) {
	if (typeof path == 'string') {
		path = path.split('.').filter(Boolean);
	}
	return _deepGet(object, path);
};

function _deepGet(object, path) {
	if (path.length==0) {
		return object;
	}
	if (path===undefined || path===null) {
		return undefined;
	}
	let head = path[0];
	let tail = path.slice(1);
	return _deepGet(object[head], tail);
}
