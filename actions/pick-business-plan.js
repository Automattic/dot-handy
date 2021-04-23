const { createAction } = require( '../lib/action' );

// Pick the Business plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		// plan step
		await page.click( 'css=button.is-business-plan' );
	},
	'/plans/
);

