const { createAction } = require( '../lib/action' );

// Pick the Business plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, config ) => {
		await page.click( 'css=button.is-business-plan' );

		return {};
	},
	'/plans'
);
