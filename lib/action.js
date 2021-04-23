createAction = ( run, initialPath = null ) => {
	return {
		run,
		initialPath,
	};
};

module.exports = {
	createAction,
};
