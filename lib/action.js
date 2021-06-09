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

const readActionFile = ( actionFile ) => {
	// FIXME: can we make this smarter without the relative path?
	const actionDir = '../actions/';
	const localActionDir = '../local-actions/';

	try {
		// look into the local actions dir.
		try {
			const actionFunc = require( localActionDir + actionFile )

			return actionFunc;
		} catch ( error ) {
			if ( error.code != 'MODULE_NOT_FOUND' ) {
				throw error;
			}
		}

		// now, look into the standard one.
		const actionFunc = require( actionDir + actionFile );

		return actionFunc;

	} catch ( error ) {
		console.error( 'A fatal error has occured when reading the action: ', actionFile, error, error.code );

		return false;
	}
};

const readActionFiles = ( actionFiles ) => {
	const actions = [];

	for ( const actionFile of actionFiles ) {
		const result = readActionFile( actionFile );

		if ( ! result ) {
			return process.exit( -1 );
		}

		actions.push( result );
	}

	return actions;
};

const asyncIf = async ( conditionFunc, ifFunc, elseFunc ) => {
	try {
		await conditionFunc();

		return await ifFunc();

	} catch {
		if ( elseFunc ) {
			return await elseFunc();
		}
	}
};

module.exports = {
	asyncIf,
	createAction,
	createPreparation,
	readActionFile,
	readActionFiles,
};
