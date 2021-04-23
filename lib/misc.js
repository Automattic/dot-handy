const crypto = require( 'crypto' );

const generateRandomString = ( length ) => crypto.randomBytes( length ).toString( 'hex' );

module.exports = {
	generateRandomString,
};
