/**
 * External dependencies
 */
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const { readConfigFiles, readActionFiles, initialize } = require( './lib/init.js' );
const { getRootUrlFromEnv } = require( './lib/misc.js' );

// TODO: this shouldn't be too hard to generalized to enable complete overriding of config flags through commandline params.
const parseOverrides = ( argv ) => {
	const eligibleParams = [
		'locale',
		'env',
		'path',
	];

	const overrides = {};

	for( const key of eligibleParams ) {
		if ( argv[ key ] ) {
			overrides[ key ] = argv[ key ];
		}
	}

	return overrides;
};

const parseCommandLine = () => {
	const argv = yargs
		.option( 'config-files', {
			alias: 'C',
			type: 'string',
		} )
		.option( 'action-files', {
			alias: 'A',
			type: 'string',
		} )
		.option( 'locale', {
			alias: 'L',
			type: 'string',
		} )
		.option( 'env', {
			alias: 'E',
			type: 'string',
		} )
		.option( 'path', {
			alias: 'P',
			type: 'string',
		} )
		.argv;

	// FIXME: too ugly
	const configFiles = argv.configFiles && argv.configFiles.split( ',' ) || [];
	const actionFiles = argv.actionFiles && argv.actionFiles.split( ',' ) || [];
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
		...configFiles,
	] );

	if ( ! configs ) {
		process.exit( -1 );
	}

	const unionConfig = {
		...configs,
		...overrides,
	};

	console.log( '------ Configuration:\n', unionConfig );

	if ( actionFiles.length === 0 ) {
		console.log( '------ No action provided. The default one will be queued.' );
		actionFiles.push( 'default-action' );
	}

	const actions = readActionFiles( actionFiles );

	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

	const {
		browser,
		context,
		page,
	} = await initialize( unionConfig );

	const extra = {
		config: unionConfig, // to make it accessible in each action.
	};
	let firstNavigation = true;
	for ( const action of actions ) {
		if ( action.initialPath != null ) {
			if ( firstNavigation ) {
				await page.goto( getRootUrlFromEnv( unionConfig.env ) + action.initialPath );
				firstNavigation = false;
			} else {
				await page.waitForNavigation( action.initialPath );
			}
		}

		const newExtra = await action.run( browser, context, page, extra )
		Object.assign( extra, newExtra );
	}
}

main();
