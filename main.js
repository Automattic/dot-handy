/**
 * External dependencies
 */
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const { initialize } = require( './lib/init.js' );
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
		actionArgs: ( rawArg ) => rawArg.map( actionArgStr => JSON.parse( actionArgStr ) ),
		explatExperiments: ( rawArg ) => {
			const elems = parseNonSpaceSeparatedList( rawArg );
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

	console.log( '------ Configuration:\n', config );
	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

	const {
		browser,
		context,
		page,
	} = await initialize( config );

	const result = await runActions( browser, context, page, config, actions );

	if ( isAbort( result ) ) {
		process.abort();
	}

	if ( isDone( result ) ) {
		process.exit();
	}
}

main();
