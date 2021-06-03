const { createAction, readActionFile } = require( '../lib/action.js' );
const { getRootUrlFromEnv } = require( '../lib/misc.js' );

const closeAccount = createAction(
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

		// if this is not null, it means that this account has pending effective purchases to remove.
		const managePurchaseButton = await page.waitForSelector( 'css=a[href="/me/purchases"]', {
			timeout: 1000,
		} );

		if ( managePurchaseButton ) {
			const removePurchaseAction = readActionFile( 'remove-purchase' );

			if ( ! removePurchaseAction ) {
				console.error( 'Cannot find remove-purch' );
				return {
					abort: true,
				};
			}

			await removePurchaseAction.run( browser, context, page, extra );

			return await closeAccount.run( browser, context, page, extra );
		}

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

module.exports = closeAccount;
