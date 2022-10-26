const { createAction, abort } = require( '../lib/action.js' );
const { asyncIf, generateRandomString } = require( '../lib/misc.js' );

const fs = require( 'fs' );
const NEW_USER_LOG_FILENAME = './new-user-log';

const writeNewUserLog = ( username ) => {
	try {
		fs.appendFileSync( NEW_USER_LOG_FILENAME, username + "\n" );
	} catch ( error ) {
		console.error( 'Cannot write to the new user log, error: ', error );
	}
};

// creating a new user at the /user step
module.exports = createAction(
	async ( browser, context, page, config ) => {
		const { newUserGmailPrefix, password } = config;

		if ( ! newUserGmailPrefix ) {
			console.error( 'The current new-user action relies on the gmail `+` trick to create a random user. Please supply one through a local-config file as `newUserGmailPrefix` field.' );

			return abort();
		}

		if ( ! password ) {
			console.error( "It's an deliberate choice to not using a random password here. If it's a ephemeral random password, it will be very hard to batch closing your test accounts. Please supply a `password` attribute through a local config file. Tip: create a `new-user.json` under `local-configs` directory so it will be automatically supplied." );
			return abort();
		}

		const randSerial = generateRandomString( 8 );
		const email = newUserGmailPrefix + '+' + randSerial + '@gmail.com';
		const userName = newUserGmailPrefix + randSerial;

		await page.fill( 'css=input#email', email );

		await asyncIf(
			async () => page.fill( 'css=input#username', userName, {
				timeout: 1000,
			} ),
			() => {},
		);
		await page.fill( 'css=input#password', password );
		await page.click( 'css=button[type="submit"]' );

		console.log( '------ user created:', userName, password );
		writeNewUserLog( userName + ' ' + password );

		return {
			userName,
			password,
		};
	},
	'/start'
);
