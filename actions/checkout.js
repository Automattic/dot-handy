const { createAction } = require( '../lib/action' );

// Checkout by the dummy card.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		await page.waitForSelector( 'css=.cart__total-amount.grand-total' );

		await page.fill( 'css=input#name', 'Jam Foo' );

		let cardNumberFrame = page.frame( '__privateStripeFrame5' );

		while ( ! cardNumberFrame ) {
			await page.waitForTimeout( 3000 );
			cardNumberFrame = page.frame( '__privateStripeFrame5' );
		}

		await cardNumberFrame.fill( 'css=input[name="cardnumber"]', '4242424242424242' );

		const expDateFrame = page.frame( '__privateStripeFrame6' );
		await expDateFrame.fill( 'css=input[name="exp-date"]', '03/28' );

		const cvcFrame = page.frame( '__privateStripeFrame7' );
		await cvcFrame.fill( 'css=input[name="cvc"]', '888' );

		await page.selectOption( 'css=select[name="country"]', 'TW' );
		await page.fill( 'css=input[name="postal-code"]', '326' );

		await page.click( 'css=button.button-pay' );
	},
	'/checkout'
);
