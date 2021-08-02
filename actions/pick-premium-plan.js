const { createAction } = require( '../lib/action' );

// Pick the Premium plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		// plan step
		await page.click( 'css=button.is-premium-plan' );

		return {};
	},
	'/plans'
);
