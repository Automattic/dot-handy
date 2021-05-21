const { createAction } = require( '../lib/action.js' );
const { generateRandomString } = require( '../lib/misc.js' );

// creating a new user at the /user step
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		const { newUserGmailPrefix, password } = extra.config;

		if ( ! newUserGmailPrefix ) {
			console.error( 'The current new-user action relies on the gmail `+` trick to create a random user. Please supply one through a local-config file as `newUserGmailPrefix` field.' );

			return {
				abort: true,
			};
		}

		if ( ! password ) {
			console.error( "It's an deliberate choice to not using a random password here. If it's a ephemeral random password, it will be very hard to batch closing your test accounts. Please supply a `password` attribute through a local config file. Tip: create a `new-user.json` under `local-configs` directory so it will be automatically supplied." );
			return {
				abort: true,
			};
		}

		const randSerial = generateRandomString( 8 );
		const email = newUserGmailPrefix + '+' + randSerial + '@gmail.com';
		const userName = newUserGmailPrefix + randSerial;

		await page.fill( 'css=input#email', email );
		await page.fill( 'css=input#username', userName );
		await page.fill( 'css=input#password', password );
		await page.click( 'css=button[type="submit"]' );

		console.log( '------ user created:', userName, password );

		return {
			userName,
			password,
		};
	},
	'/start'
);
