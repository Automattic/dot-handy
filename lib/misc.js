const crypto = require( 'crypto' );

const generateRandomString = ( length ) => crypto.randomBytes( length ).toString( 'hex' );

const getRootUrlFromEnv = ( envSlug ) => {
	const envMap = {
		production: 'https://wordpress.com',
		local: 'http://calypso.localhost:3000',
		wpcalypso: 'https://wpcalypso.wordpress.com',
	};

	return envMap[ envSlug ] ?? envMap.production;
};

module.exports = {
	generateRandomString,
	getRootUrlFromEnv,
};