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

		// waiting for the placeholder to be gone
		await page.waitForSelector( 'div.account-close.is-loading', {
			state: 'hidden',
		} );

		// click the Close Account button
		await page.click( 'css=div.action-panel__cta >> css=button.is-scary' );

		// click the Continue button on the survey screen
		await page.click( 'css=div.dialog__action-buttons >> css=button.is-primary' );

		// fill in the username as the final confirmation
		await page.fill( 'css=input#confirmAccountCloseInput', extra.config.username );

		// final doom
		await page.click( 'css=div.dialog__action-buttons >> css=button.is-scary' );

		// waiting for the final screen
		await page.waitForSelector( 'css=div.empty-content' );

		return {
			done: true,
		};
	},
	'/'
);
