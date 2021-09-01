const { createAction, readActionFile, abort, done } = require( '../lib/action.js' );
const { asyncIf, getRootUrlFromEnv } = require( '../lib/misc.js' );

const closeAccount = createAction(
	async ( browser, context, page, extra ) => {
		const { username } = extra.config;

		if ( ! username ) {
			console.error( 'No username is supplied. Please note that close-account should go after a successful login.' );

			return abort();
		}

		await page.goto( getRootUrlFromEnv( extra.config.env ) + '/me/account/close' );

		// waiting for the placeholder to be gone
		await page.waitForSelector( 'div.account-close.is-loading', {
			state: 'hidden',
		} );


		// if this button has presented, it means that this account has pending effective purchases to remove.
		const startOver = await asyncIf(
			async () => await page.waitForSelector( 'css=div.account-close a[href="/me/purchases"]', {
				timeout: 1000,
			} ),
			async () => {
				const removeAllPurchases = readActionFile( 'remove-all-purchases' );

				if ( ! removeAllPurchases ) {
					console.error( 'Cannot find the action for removing all the purchases. Aborting.' );
					return abort();
				}

				await removeAllPurchases.run( browser, context, page, extra );

				return true;
			},
			async () => {
				console.log( '---------No remaing purchases. The account is ready to be closed.' );
			},
		);

		// FIXME: can't this be simpler?
		if ( startOver ) {
			return await closeAccount.run( browser, context, page, extra );
		}

		// if it's an Atomic site. There is nothing we can automate from here :shrug:
		const isAtomic = await asyncIf(
			async () => page.waitForSelector( 'div.action-panel__cta a[href="/help/contact"]', {
				timeout: 1000,
			} ),
			async () => {
				return true;
			},
		);

		if ( isAtomic ) {
			console.log( "-------------------- It is an Atomic site. So let's dance and move on from here." );
			return done();
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

		return done();
	},
	'/'
);

module.exports = closeAccount;
