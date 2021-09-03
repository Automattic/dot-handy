/**
 * External dependencies
 */
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const {
	setLocalStorage,
	initialize,
} = require( './lib/init.js' );
const { readConfigFiles, mergeConfig } = require( './lib/config.js' );
const { readActionFiles, isDone, isAbort } = require( './lib/action.js' );
const { getRootUrlFromEnv, parseNonSpaceSeparatedList } = require( './lib/misc.js' );

// TODO: this shouldn't be too hard to generalized to enable complete overriding of config flags through commandline params. I should consider to implement a config schema.
const parseOverrides = ( argv ) => {
	const eligibleParams = [
		'action-args',
		'browser',
		'explat-experiments',
		'cookies',
		'currency',
		'env',
		'path',
		'username',
		'password',
		'localstorage',
		'locale',
	];

	const overrides = {};

	for( const key of eligibleParams ) {
		if ( argv[ key ] ) {
			// FIXME: terrible!
			if ( key == 'localstorage' || key == 'cookies' ) {
				overrides[ key ] = JSON.parse( argv[ key ] );
			} else if ( key == 'explat-experiments' ) { // FIXME: OMG!!
				const elems = parseNonSpaceSeparatedList( argv[ key ] );
				const experiments = [];

				if ( elems.length % 2 != 0 ) {
					console.error( 'explat-experiments: slugs and variants should come in pairs' );
					continue;
				}

				for( let i = 0; i < elems.length; i += 2 ) {
					const slug = elems[ i ];
					let variant = elems[ i + 1 ];
					// base level sanitizing ...
					if ( i % 2 == 0 && variant !== 'treatment' && variant !== 'control' ) {
						console.error( 'explat-experiments: variant should be either treatment or control.', variant, 'is given. Use control as default.' );
						variant = 'control';
					}
					experiments.push( [ slug, variant ] );
				}

				overrides['explatExperiments'] = experiments;

			} else if ( key == 'action-args' ) { //FIXME: O.M.G.
				const actionArgs = argv[ key ];
			} else {
				overrides[ key ] = argv[ key];
			}
		}
	}

	return overrides;
};

const processCmds = () => {
	const argv = yargs
		.option( 'action-files', {
			alias: 'A',
			type: 'string',
		} )
		.option( 'action-args', {
			alias: 'AR',
			type: 'array',
		} )
		.option( 'browser', {
			alias: 'B',
			type: 'string',
		} )
		.option( 'config-files', {
			alias: 'C',
			type: 'string',
		} )
		.option( 'cookies', {
			type: 'string',
		} )
		.option( 'currency', {
			type: 'string',
		} )
		.option( 'env', {
			alias: 'E',
			type: 'string',
		} )
		.option( 'explat-experiments', {
			type: 'string',
		} )
		.option( 'locale', {
			alias: 'LC',
			type: 'string',
		} )
		.option( 'localstorage', {
			alias: 'LS',
			type: 'string',
		} )
		.option( 'path', {
			alias: 'P',
			type: 'string',
		} )
		.option( 'password', {
			type: 'string',
		} )
		.option( 'username', {
			type: 'string',
		} )
		.argv;

	const configFiles = parseNonSpaceSeparatedList( argv.configFiles );
	const actionFiles = parseNonSpaceSeparatedList( argv.actionFiles );
	const overrides = parseOverrides( argv );

	return {
		configFiles,
		actionFiles,
		overrides,
	};
};

const setup = () => {
	const {
		configFiles,
		actionFiles,
		overrides,
	} = processCmds();

	const configs = readConfigFiles( [
		'default-config',
		...actionFiles, // A very opinionated functionality that it will by default look up for configuration files having the same name.
						// so actions like login and new-user can be used without having to supply their local configs everytime.
		...configFiles,
	] );

	if ( ! configs ) {
		process.exit( -1 );
	}

	if ( actionFiles.length === 0 ) {
		console.log( '------ No action provided. The default "navigate" will be queued.' );
		actionFiles.push( 'navigate' );
	}

	const actions = readActionFiles( actionFiles );

	if ( actions.error ) {
		console.error( 'A fatal error has occured when reading the action: ', actions.meta.fileName, actions.meta.code );
		process.exit( -1 );
	}

	const actionArgs = [];

	return {
		config: mergeConfig( configs, overrides ),
		actions,
		actionFiles,
		actionArgs,
	};
};

const main = async () => {
	const {
		config,
		actions,
		actionFiles,
		actionArgs,
	} = setup();

	console.log( '------ Configuration:\n', config );
	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

	const {
		browser,
		context,
		page,
	} = await initialize( config );

	const runAction = async ( action, extra ) => {
		const actionResult = await action.run( browser, context, page, extra )

		if ( actionResult ) {
			// An action claims that there is something worth aborting.
			if ( isAbort( actionResult ) ) {
				process.exit( -1 );
			}

			// An intentional exit that indicates no further action should follow.
			if ( isDone( actionResult ) ) {
				process.exit( 0 );
			}

			Object.assign( extra, actionResult );
		}

		return extra;
	};

	const runPreps = async ( preps, extra ) => {
		let newExtra = {
			...extra,
		};
		for ( const preparation of preps ) {
			Object.assign( newExtra, await runAction( preparation, extra ) );
		}

		return newExtra;
	}

	let extra = {
		config: config, // to make it accessible in each action.
	};
	let firstNavigation = true;
	let preps = [];

	for ( const action of actions ) {
		// A "preparation" action is a special kind of actions that are queued and run before a normal action.
		// A good example for this is `set-explat`. It doesn't have any specific starting point, and will normally need
		// to happen right after navigation but before the automated actions taking place. For more details, please refer to
		// the JSDoc of `createPreparation()`.
		if ( action.isPreparation ) {
			preps.push( action );
			continue;
		}

		const { initialPath } = action;

		if ( initialPath != null ) {
			// Navigate to the initial path when encountering a first non-preparation action.
			// If a smarter, general way of deciding when navigating to the initial path should happen, this can be eliminated and I'll be happy.
			if ( firstNavigation ) {
				await page.goto( getRootUrlFromEnv( config.env ) + action.initialPath );

				// Localstorage can't be set without a domain, hence putting it here.
				if ( config.localStorage ) {
					await setLocalStorage( page, config.localStorage );
				}

				firstNavigation = false;
			} else {
				const initialPathRegex = new RegExp( action.initialPath, 'i' );
				const currentUrl = new URL( page.url() );

				// using a regex match here because I don't want it to be too strict.
				if ( ! initialPathRegex.test( currentUrl ) ) {
					await page.waitForNavigation( {
						url: initialPathRegex,
					} );
				}
			}
		}

		extra = await runAction( action, await runPreps( preps, extra ) );
		preps = [];
	} // for ( const action ... )

	// if there are unfinished preparation actions, finishing them up here.
	await runPreps( preps );
}

main();
