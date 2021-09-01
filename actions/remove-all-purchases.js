/**
 * External dependencies
 */
const validator = require( 'validator' );

/**
 * Internal dependencies
 */
const { createAction, abort } = require( '../lib/action.js' );
const { asyncIf, getRootUrlFromEnv } = require( '../lib/misc.js' );

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

		// Toggle off auto-renewal if any
		await asyncIf(
			async () => page.click( 'css=.components-form-toggle.is-checked input[type="checkbox"]', {
				timeout: 1000,
			} ),
			async () => {
				await page.click( 'div.auto-renew-disabling-dialog button[data-e2e-button="confirm"]' );

				await page.click( 'button[data-e2e-button="skip"]' );
			},
		);

		// click on the remove purchase card
		await page.click( 'css=button.remove-purchase__card' );

		// there might be a non-primary domain dialog for those sites bound to a free .blog domain, e.g. xxx.photo.blog
		await asyncIf(
			async () => page.waitForSelector( 'css=div.non-primary-domain-dialog', {
				timeout: 1000,
			} ),
			async () => {
				page.click( 'css=div.dialog__action-buttons button[data-e2e-button="remove"]' );
			}
		);

		// if it's a cancel purchase form.
		await asyncIf(
			async () => await page.waitForSelector( 'div.cancel-purchase-form__dialog', {
				timeout: 1000,
			} ),
			// if a plan subscription cancellation survey is shown.
			asyncIf(
				async () => await page.check( 'css=input[name="anotherReasonOne"]', {
					timeout: 3000,
				} ),
				async () => {
					// fill out the survey.
					await page.fill( 'css=input[name="anotherReasonOneInput"]', 'test' );
					await page.check( 'css=input[name="anotherReasonTwo"]' );
					await page.fill( 'css=input[name="anotherReasonTwoInput"]', 'test' );
					await page.click( 'css=button[data-e2e-button="next"]' );

					await page.click( 'css=button[data-e2e-button="remove"]' );
				},
				async () => {
					// it's also possible that there is no survey, but the button is there e.g. a domain mapping
					// in those cases, we can just click on the button of doom.
					await page.click( 'css=button[data-e2e-button="remove"]' );
				},
			),
		);

		// it can be a domain cancellation form.
		await asyncIf(
			async () => await page.waitForSelector( 'div.remove-domain-dialog__dialog', {
				timeout: 1000,
			} ),
			async () => {
				await page.click( 'css=button[data-e2e-button="remove"]' );

				const domain = await extractDomainStringfromDialog( page );

				if ( ! domain ) {
					console.error( 'Cannot find a domain string in the domain cancellation dialog. Aborting.' );

					return abort();
				}

				await page.fill( 'css=input[name="domain"]', domain );
				await page.check( 'css=input[name="agree"]' );
				await page.click( 'css=button[data-e2e-button="remove"]' );
			},
		);

		return {};
	},
	'/me/purchases'
);

const removeAllPurchases = createAction(
	async ( browser, context, page, extra ) => {
		await page.goto( getRootUrlFromEnv( extra.config.env ) + '/me/purchases' );

		return asyncIf(
			async () => page.waitForSelector( 'css=a[data-e2e-connected-site=true]:last-child', {
				timeout: 3000,
			}),
			async () => {
				await removePurchase.run( browser, context, page, extra );

				return removeAllPurchases.run( browser, context, page, extra );
			},
		);
	},
	'/me/purchases'
);

// remove all purchases from a logged-in account
module.exports = removeAllPurchases;
