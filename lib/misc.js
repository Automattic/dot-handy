const crypto = require( 'crypto' );

const generateRandomString = ( length ) => crypto.randomBytes( length ).toString( 'hex' );

const getRootUrlFromEnv = ( envSlug ) => {
	const envMap = {
		production: 'https://wordpress.com',
		local: 'http://calypso.localhost:3000',
		wpcalypso: 'https://wpcalypso.wordpress.com',
	};

	const resultEnv = envMap[ envSlug ];

	return resultEnv ? resultEnv : envMap.production;
};

const parseNonSpaceSeparatedList = ( str, separator = ',' ) => {
	if ( ! str ) {
		return [];
	}

	return str.trim().replace( /\s*,\s*/g, separator ).split( separator );
};

module.exports = {
	generateRandomString,
	getRootUrlFromEnv,
	parseNonSpaceSeparatedList,
};
