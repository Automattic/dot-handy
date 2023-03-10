/**
 * External dependencies
 */
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const {
	initialize,
	goToStartUrl,
	postFirstNavigationSetup
} = require( './lib/init.js' );
const { readConfigFiles, mergeConfig } = require( './lib/config.js' );
const {
	readActionFiles,
	runActions,
	isAbort,
	isDone,
} = require( './lib/action.js' );
const { parseNonSpaceSeparatedList } = require( './lib/misc.js' );

// TODO:
// This implementation will bring in unwanted props from yargs as well. e.g. the aliased fields, the wildcard field, etc.
// Needs a better way to define the schema of the configuration object.
const cmdArgsToConfig = ( argv ) => {
	const convertHandler = {
		explatExperiments: ( elems ) => {
			const experiments = [];

			if ( elems.length % 2 != 0 ) {
				console.error( 'explat-experiments: slugs and variants should come in pairs' );
				return [];
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

			return experiments;
		},
		cookies: ( rawArg ) => JSON.parse( rawArg ),
		localstorage: rawArg => JSON.parse( rawArg ),
	};

	const converted = { ... argv };

	Object.keys( argv ).map( ( key ) => {
		const val = converted[ key ];
		converted[ key ] = convertHandler[ key ] ? convertHandler[ key ]( val ) : val;
	} );

	return converted;
};

const processCmds = () => {
	const argv = yargs
		.option( 'action-files', {
			alias: 'A',
			type: 'array',
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
			type: 'array',
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
			type: 'array',
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

	const {
		configFiles = [],
		actionFiles = [],
	} = argv;

	const configFromCmdArgs = cmdArgsToConfig( argv );

	return {
		actionFiles,
		configFiles,
		configFromCmdArgs,
	};
};

const setup = () => {
	const {
		configFiles,
		actionFiles,
		configFromCmdArgs,
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

	const actions = readActionFiles( actionFiles );

	if ( actions.error ) {
		console.error( 'A fatal error has occured when reading the action: ', actions.meta.fileName, actions.error );
		process.exit( -1 );
	}

	const actionArgs = [];

	return {
		config: mergeConfig( configs, configFromCmdArgs ),
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

	const redacted = {
		... config,
		password: "馬賽克",
	};

	console.log( '------ Configuration:\n', redacted );
	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

	const runEnv = await initialize( config );

	try {
		// the first navigation is special since there are things that we can only do after the page instance has a domain.
		// e.g. setting a cookie without explicitly assigning a domain, the localstorage, etc.
		await goToStartUrl( runEnv, actions );

		await postFirstNavigationSetup( runEnv );

		const result = await runActions( runEnv, actions );

		if ( isAbort( result ) ) {
			process.abort();
		}

		if ( isDone( result ) ) {
			process.exit();
		}
	} catch ( error ) {
		console.error( 'Something goes wrong! 💣', error );
	}
}

main();
