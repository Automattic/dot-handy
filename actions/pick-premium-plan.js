const { createAction } = require( '../lib/action' );

// Pick the Premium plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, config ) => {
		await page.click( 'button.is-premium-plan' );

		return {};
	},
	'/plans'
);
