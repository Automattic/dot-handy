const fs = require( 'fs' );

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
	let unionConfig = {};

	for ( const configFile of configFiles ) {
		const result = readConfigFile( configDir + configFile + '.json' );

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
		// FIXME: inproper place to print a log
		console.error( 'An error has occureed during reading the action file: ' + actionFile, error );

		return false;
	}
};

const readActionFiles = ( actionFiles ) => {
	const actions = [];

	// FIXME: can we make this smarter without the relative path?
	const actionDir = '../actions/';

	for ( const actionFile of actionFiles ) {
		const result = readActionFile( actionDir + actionFile );

		if ( ! result ) {
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
		initialPath,
	} = config;

	const module = require( 'playwright' );
	const browserClass =  module[ browserSlug ];

	if ( ! browserClass ) {
		return null;
	}

	const browser = await browserClass.launch( {
		headless: false,
	} );

	const context = await browser.newContext( {
		locale,
	} );

	const page = await context.newPage();
	const initialUrl = rootUrl + initialPath;

	await page.goto( initialUrl );

	return {
		browser,
		context,
		page,
	};
};

module.exports = {
	readConfigFiles,
	readActionFiles,
	initialize,
};
