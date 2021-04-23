const { createAction } = require( '../lib/action' );

// Pick the Free plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		await page.click( 'css=#step-header >> css=button[type="button"]' );

		return {};
	},
	'/plans'
);
