/**
 * External dependencies
 */
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

// TBD: maybe add a restricted config schema?
const mergeConfig = ( current, next ) => {
	const merged = { ... current };

	for ( const key in next ) {
		const curValue = current[ key ];
		const nextValue = next[ key ];

		// this is so that array-valued properties like localStorage and cookies can be accumulated through multiple configs.
		if ( Array.isArray( curValue ) && Array.isArray( nextValue ) ) {
			merged[ key ] = curValue.concat( nextValue );
		} else {
			merged[ key ] = nextValue;
		}
	}

	return merged;
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

		unionConfig = mergeConfig( unionConfig, result );
	}

	return unionConfig;
};

module.exports = {
	readConfigFile,
	readConfigFiles,
	mergeConfig,
};
