const { createAction } = require( '../lib/action' );

// Pick the Business plan at the /plans step
module.exports = createAction(
	async ( browser, context, page ) => {
		await page.click( 'css=button.is-ecommerce-plan' );

		return {};
	},
	'/plans'
);
