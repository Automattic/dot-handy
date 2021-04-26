const { createAction } = require( '../lib/action.js' );
const { getRootUrlFromEnv } = require( '../lib/misc.js' );

// login as a test username.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		const { username } = extra.config;

		if ( ! username ) {
			console.error( 'No username is supplied. Please note that close-account should go after a successful login.' );

			return {
				abort: true,
			};
		}

		await page.goto( getRootUrlFromEnv( extra.config.env ) + '/me/account/close' );

		// this isn't perfect, but works for me :(
		await page.waitForTimeout( 1000 );

		// click the Close Account button
		await page.click( 'css=div.action-panel >> css=button.is-scary' );

		// click the Continue button on the survey screen
		await page.click( 'css=div.dialog__action-buttons >> css=button.is-primary' );

		// fill in the username as the final confirmation
		await page.fill( 'css=input#confirmAccountCloseInput', extra.config.username );

		// final doom
		await page.click( 'css=div.dialog__action-buttons >> css=button.is-scary' );

		return {
			done: true,
		};
	},
	'/'
);
