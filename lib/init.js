const fs = require( 'fs' );

// priority: extendedPaths -> primaryDir. e.g. `local-configs` should be preferred over `configs`.
const resolvePath = ( primaryDir, extendedPaths, targetFileName ) => {
	const dirs = [
		...extendedPaths,
		primaryDir,
	];

	for( const dir of dirs ) {
		const candidatePath = dir + targetFileName;

		if ( fs.existsSync( candidatePath ) ) {
			return candidatePath;
		}
	}

	return null;
};

const readConfigFile = ( configFile ) => {
	try {
		const content = fs.readFileSync( configFile );
		const configObj = JSON.parse( content );
		return configObj;
	} catch( error ) {
		// FIXME: inproper place to print a log
		console.error( 'An error has occureed during reading the config file: ' + configFile, error );

		return false;
	}
};

const readConfigFiles = ( configFiles ) => {
	const configDir = './configs/';
	const localConfigDir = './local-configs/';

	let unionConfig = {};

	for ( const configFile of configFiles ) {
		const resolvedPath = resolvePath( configDir, [ localConfigDir ], configFile + '.json' );

		if ( ! resolvedPath ) {
			continue;
		}

		const result = readConfigFile( resolvedPath );

		if ( ! result ) {
			return false;
		}

		Object.assign( unionConfig, result );
	}

	return unionConfig;
};

const readActionFile = ( actionFile ) => {
	try {
		const actionFunc = require( actionFile );

		return actionFunc;
	} catch ( error ) {
		return false;
	}
};

const readActionFiles = ( actionFiles ) => {
	const actions = [];

	// FIXME: can we make this smarter without the relative path?
	const actionDir = '../actions/';
	const localActionDir = '../local-actions/';

	for ( const actionFile of actionFiles ) {
		const result = readActionFile( localActionDir + actionFile ) ||
						readActionFile( actionDir + actionFile );

		if ( ! result ) {
			console.error( 'A fatal error has occured when reading the action: ', actionFile );
			return process.exit( -1 );
		}

		actions.push( result );
	}

	return actions;
};

const initialize = async ( config ) => {
	const {
		browser: browserSlug,
		locale,
		rootUrl,
	} = config;

	const module = require( 'playwright' );
	const browserClass =  module[ browserSlug ];

	if ( ! browserClass ) {
		return null;
	}

	// config the browser instance
	const browser = await browserClass.launch( {
		headless: false,
	} );

	// config the context instance
	const context = await browser.newContext( {
		locale,
	} );

	// config the page instance
	const page = await context.newPage();

	return {
		browser,
		context,
		page,
	};
};

const configLocalStorage = async ( page, entries ) => {
	// TODO: better error handling
	for ( const entry of entries ) {
		await page.evaluate( ([key, value]) => {
			window.localStorage.setItem( key, value );
		}, entry );
	}
};

module.exports = {
	configLocalStorage,
	readConfigFiles,
	readActionFiles,
	initialize,
};
