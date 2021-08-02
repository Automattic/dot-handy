const { createAction } = require( '../lib/action' );

// Pick the Personal plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		// plan step
		await page.click( 'css=button.is-personal-plan' );

		return {};
	},
	'/plans'
);
