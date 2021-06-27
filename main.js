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
const { readActionFiles } = require( './lib/action.js' );
const { getRootUrlFromEnv, parseNonSpaceSeparatedList } = require( './lib/misc.js' );

// TODO: this shouldn't be too hard to generalized to enable complete overriding of config flags through commandline params. I should consider to implement a config schema.
const parseOverrides = ( argv ) => {
	const eligibleParams = [
		'browser',
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
				overrides[ key ] = JSON.parse( argv[ key] );
				continue;
			}
			overrides[ key ] = argv[ key];
		}
	}

	return overrides;
};

const parseCommandLine = () => {
	const argv = yargs
		.option( 'action-files', {
			alias: 'A',
			type: 'string',
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

const main = async () => {
	const {
		configFiles,
		actionFiles,
		overrides,
	} = parseCommandLine();

	const configs = readConfigFiles( [
		'default-config',
		...actionFiles, // A very opinionated functionality that it will by default look up for configuration files having the same name.
						// so actions like login and new-user can be used without having to supply their local configs everytime.
		...configFiles,
	] );

	if ( ! configs ) {
		process.exit( -1 );
	}

	const unionConfig = mergeConfig( configs, overrides );

	console.log( '------ Configuration:\n', unionConfig );

	if ( actionFiles.length === 0 ) {
		console.log( '------ No action provided. The default "navigate" will be queued.' );
		actionFiles.push( 'navigate' );
	}

	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

	const actions = readActionFiles( actionFiles );

	const {
		browser,
		context,
		page,
	} = await initialize( unionConfig );

	const extra = {
		config: unionConfig, // to make it accessible in each action.
	};
	let firstNavigation = true;
	let preps = [];
	for ( const action of actions ) {
		// A "preparation" action is a special kind of actions that are queued and run before a normal action.
		// A good example for this is `set-explat`. It doesn't have any specific starting point, and will normally need
		// to happen right after navigation but before the automated actions taking place.
		if ( action.isPreparation ) {
			preps.push( action );
			continue;
		}

		if ( action.initialPath != null ) {
			if ( firstNavigation ) {
				await page.goto( getRootUrlFromEnv( unionConfig.env ) + action.initialPath );
				if ( unionConfig.localStorage ) {
					await setLocalStorage( page, unionConfig.localStorage );
				}

				firstNavigation = false;
			} else {
				await page.waitForNavigation( action.initialPath );
			}
		}
		// finish up all the queued preparation
		for ( const preparation of preps ) {
			await preparation.run( browser, context, page, extra )
		}
		preps = [];

		const newExtra = await action.run( browser, context, page, extra )

		// TODO: Terrible. Generalize this thing by some common senses.
		if ( newExtra ) {
			// An action claims that there is something worth aborting.
			if ( newExtra.abort ) {
				process.exit( -1 );
			}

			// An intentional exit that indicates no further action should follow.
			if ( newExtra.done ) {
				process.exit( 0 );
			}

			Object.assign( extra, newExtra );
		}
	}
}

main();
