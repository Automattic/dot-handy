// TODO: awful dependencies here. How can we decouple them?
const {
	setLocalStorage,
} = require( './init.js' );
const { getRootUrlFromEnv } = require( './misc.js' );

/**
 * Create an action. This function is designed to be used in a action file to be read.
 * Upon writing this, a action file is read as a node module. Thus, the fundamental format
 * will be:
 *
 * module.exports = createAction( ... );
 *
 * @param {function} run - an async function with the signature: async ( browser, context, page, config, accum, args ) -> Object
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
		return {
			error: true,
			meta: {
				fileName: actionFile,
				code: error.code,
			},
		};
	}
};

const readActionFiles = ( actionFiles ) => {
	const actions = [];

	for ( const actionFile of actionFiles ) {
		const result = readActionFile( actionFile );

		if ( result.error ) {
			return result;
		}

		actions.push( result );
	}

	return actions;
};

const isPreparationAction = ( action ) => action.isPrepartion;

const abort = () => ( { abort: true } );
const isAbort = ( { abort } ) => abort;

const done = () => ( { done: true } );
const isDone = ( { done } ) => done;

const isEarlyReturn = ( r ) => isAbort( r ) || isDone( r );

const findFirstPath = ( actions ) => {
	for ( const action of actions ) {
		if ( ! action.isPreparation && action.initialPath ) {
			return action.initialPath;
		}
	}

	return '/';
}

const runSingleAction_ = async ( browser, context, page, config, action, accum ) => {
	const { initialPath } = action;

	// make sure the expected page indentified by the path is reached before running the action
	if ( initialPath != null ) {
		const initialPathRegex = new RegExp( action.initialPath, 'i' );
		const currentUrl = new URL( page.url() );

		// using a regex match here because I don't want it to be too strict.
		if ( ! initialPathRegex.test( currentUrl ) ) {
			await page.waitForNavigation( {
				url: initialPathRegex,
			} );
		}
	}

	const result = await action.run(
		browser,
		context,
		page,
		config,
		accum
	) || {}; // This might be a bad idea, but this can't be easily enforced without static typing :(

	return {
		...accum,
		...result,
	};
};

const runPrepsAndAction_ = async ( browser, context, page, config, preps, primaryAction, accum ) => {
	if ( preps.length == 0 ) {
		return await runSingleAction_(
			browser,
			context,
			page,
			config,
			primaryAction,
			accum
		);
	}

	const [ headPrep, ...tailPreps ] = preps;

	const headPrepResult = await runSingleAction_(
		browser,
		context,
		page,
		config,
		headPrep,
		accum
	);

	return await runPrepsAndAction_(
		browser,
		context,
		page,
		config,
		tailPreps,
		primaryAction,
		headPrepResult
	);
};

const runActions_ = async ( browser, context, page, config, actions, accum ) => {
	if ( actions.length == 0 ) {
		return accum;
	}

	let prepEnd = 0;
	let firstNonPrepAction;
	for (; prepEnd < actions.length; ++prepEnd ) {
		const action = actions[ prepEnd ];

		if ( ! action.isPreparation ) {
			firstNonPrepAction = action;
			break;
		}
	}

	const prepsAndActionResult = await runPrepsAndAction_(
		browser, context, page, config, actions.slice( 0, prepEnd ), firstNonPrepAction, accum
	);

	return await runActions_(
		browser,
		context,
		page,
		config,
		actions.slice( prepEnd + 1 ),
		prepsAndActionResult
	);
};

const runActions = async ( browser, context, page, config, actions ) => {
	// the very beginning navigation so the following can start from a valid origin
	const beginningPath = findFirstPath( actions );
	await page.goto( getRootUrlFromEnv( config.env ) + beginningPath );

	// Localstorage can't be set without a domain, hence putting it here.
	if ( config.localStorage ) {
		await setLocalStorage( page, config.localStorage );
	}

	return await runActions_( browser, context, page, config, actions, {} );
};

module.exports = {
	createAction,
	createPreparation,
	readActionFile,
	readActionFiles,
	runActions,

	abort,
	isAbort,
	done,
	isDone,
};
