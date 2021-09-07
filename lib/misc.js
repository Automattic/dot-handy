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

const asyncIf = async ( conditionFunc, ifFunc, elseFunc ) => {
	try {
		await conditionFunc();

		return await ifFunc();

	} catch {
		if ( elseFunc ) {
			return await elseFunc();
		}
	}
};

module.exports = {
	asyncIf,
	generateRandomString,
	getRootUrlFromEnv,
};
