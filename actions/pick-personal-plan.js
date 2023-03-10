const { createAction } = require( '../lib/action' );

// Pick the Personal plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, config ) => {
		await page.click( 'css=button.is-personal-plan' );

		return {};
	},
	'/plans'
);
