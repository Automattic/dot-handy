const { createAction } = require( '../lib/action' );

// Pick the Free plan at the /plans step
module.exports = createAction(
	async ( browser, context, page ) => {
		await page.click( 'button.is-free-plan' );

		return {};
	},
	'/plans'
);
