/**
 * Create an action. This function is designed to be used in a action file to be read.
 * Upon writing this, a action file is read as a node module. Thus, the fundamental format
 * will be:
 *
 * module.exports = createAction( ... );
 *
 * @param {function} run - an async function with the signature: async ( browser, context, page, extra ) -> Object
 * 		Its returned object will be passed along with the configuration object to the next action. See `actions/new-user` as an example.
 * @param {string|null} initialPath - the path in the URL that an action is expected to run at. e.g. /pricing, /start, etc.
 * 		Many actions are desgined for automating certain user interactions on particular web pages, so this parameter is specifically for preventing
 * 		them from running on unexpected paths. It is matched by a regex, so a partial path will be enough. A null initialPath means the action
 * 		is expected to be run whenever it's its turn. Note that it won't navigate to initialPath automatically.
 * 		Instead, users are required to chain the actions properly to make sure that the navigation happens in the desired order.
 *
 * @return {object} the resulting action object.
 */
createAction = ( run, initialPath = null ) => {
	return {
		run,
		initialPath,
	};
};

/**
 * Create a preparation action. This function is designed to be used in a action file to be read.
 * Upon writing this, a action file is read as a node module. Thus, the fundamental format
 * will be:
 *
 * module.exports = createAction( ... );
 *
 * A preparation action is a special action that will be run as a batch before the immediate next regular action. e.g.
 * > yarn start -A prep1,prep2,new-user
 * prep1 and prep2 will be run in sequence right before `new-user` is ready to run, i.e. when the `initialPath` of `new-user` has been arrived.
 *
 * It was first introduced sepcifically for `set-explat`, since we`d need to hit the endpoints in the right domain, and sometimes even at the right path.
 * For example, if we want to assign ourselves to the treatment of upon signing up. Without the preparation action, it would be:
 * > yarn start -A navigate,set-explat,new-user
 *
 * @run {function} run - an async fuinction with the signature: async (browser, context, page, extra) -> Object. See the doc of `createAction()` for more details.
 */
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

module.exports = {
	createAction,
	createPreparation,
	readActionFile,
	readActionFiles,
};
