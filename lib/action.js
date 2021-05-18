createAction = ( run, initialPath = null ) => {
	return {
		run,
		initialPath,
	};
};

createPreparation = ( run ) => {
	return {
		run,
		isPreparation: true,
	};
};

module.exports = {
	createAction,
	createPreparation,
};
