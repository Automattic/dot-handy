const { createAction } = require( '../lib/action' );

// Checkout by the dummy card.
module.exports = createAction(
	async ( browser, context, page, config, accum, args ) => {
		// Wait for the grand total
		await page.waitForSelector( 'css=.wp-checkout-order-summary__total-price' );

		// Fill in the postal code and select the country
		await page.fill( 'css=input#contact-postal-code', '326' );
		await page.selectOption( 'css=select#country-selector', 'TW' );

		await page.click( 'css=.checkout-step.is-active >> css=button.checkout-button' );

		// Fill in the card holder name.
		await page.fill( 'css=input#cardholder-name', 'Jam Foo' );

		// Fill in the dummy card number
		const cardNumberElement = await page.$( 'span.number .__PrivateStripeElement iframe' );
		const cardNumberFrame = await cardNumberElement.contentFrame();
		await cardNumberFrame.fill( 'css=input[name="cardnumber"]', '4242424242424242' );

		// Fill in the dummy expiry date
		const expiryDateElement = await page.$( 'span.expiration-date .__PrivateStripeElement iframe' );
		const expiryDateFrame = await expiryDateElement.contentFrame();
		await expiryDateFrame.fill( 'css=input[name="exp-date"]', '0328' );

		// Fill in the dummy security code
		const securityCodeElement = await page.$( 'span.cvv .__PrivateStripeElement iframe' );
		const securityCodeFrame = await securityCodeElement.contentFrame();
		await securityCodeFrame.fill( 'css=input[name="cvc"]', '888' );

		// Checkout
		await page.click( 'css=.checkout-submit-button >> css=button.checkout-button' );
	},
	'/checkout'
);
