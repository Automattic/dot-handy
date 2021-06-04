/**
 * External dependencies
 */
const validator = require( 'validator' );

/**
 * Internal dependencies
 */
const { createAction } = require( '../lib/action.js' );
const { getRootUrlFromEnv } = require( '../lib/misc.js' );

const extractDomainStringfromDialog = async ( page ) => {
	const candidateElems = await page.$$( 'css=.remove-domain-dialog__dialog p strong' );

	for ( const candidateElem of candidateElems ) {
		const innerText = await candidateElem.innerText();

		if ( validator.isURL( innerText ) ) {
			return innerText;
		}
	}

	return null;
};

const removePurchase = createAction(
	async ( browser, context, page, extra ) => {

		// go into the 1st one. Yeah, it's weird that :last-child actually refers to the 1st one in Playwright somehow.
		await page.click( 'css=a[data-e2e-connected-site=true]:last-child' );

		// click on the remove purchase card
		await page.click( 'css=button.remove-purchase__card' );

		try {
			// see if it's a plan subscription first.
			await page.waitForSelector( 'div.cancel-purchase-form__dialog', {
				timeout: 1000,
			} );

			// survey page 1
			await page.check( 'css=input[name="anotherReasonOne"]' );
			await page.fill( 'css=input[name="anotherReasonOneInput"]', 'test' );
			await page.check( 'css=input[name="anotherReasonTwo"]' );
			await page.fill( 'css=input[name="anotherReasonTwoInput"]', 'test' );
			await page.click( 'css=button[data-e2e-button="next"]' );

			// say goodbye
			await page.click( 'css=button[data-e2e-button="remove"]' );

			return {};
		} catch {
			// Nope.
			console.log( 'A purchase cancellation form is not found. Try something else ...' );
		}

		try {
			// so it can be a domain ...
			await page.waitForSelector( 'div.remove-domain-dialog__dialog' );
			await page.click( 'css=button[data-e2e-button="remove"]' );

			const domain = await extractDomainStringfromDialog( page );

			if ( ! domain ) {
				console.error( 'Cannot find a domain string in the domain cancellation dialog. Aborting.' );

				return {
					abort: true,
				};
			}

			await page.fill( 'css=input[name="domain"]', domain );
			await page.check( 'css=input[name="agree"]' );
			await page.click( 'css=button[data-e2e-button="remove"]' );

			return {};
		} catch {
			// something else we didn't handle. Abort.
			return {
				abort: true,
			};
		}

		return {};
	},
	'/me/purchases'
);

const removeAllPurchases = createAction(
	async ( browser, context, page, extra ) => {
		await page.goto( getRootUrlFromEnv( extra.config.env ) + '/me/purchases' );

		const purchaseCard = await page.waitForSelector( 'css=a[data-e2e-connected-site=true]:last-child' );

		if ( purchaseCard ) {
			await removePurchase.run( browser, context, page, extra );

			return removeAllPurchases.run( browser, context, page, extra );
		}

		return {};
	},
	'/me/purchases'
);

// remove all purchases from a logged-in account
module.exports = removeAllPurchases;
