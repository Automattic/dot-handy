const { createAction } = require( '../lib/action' );

// Pick the Personal plan at the /plans step
module.exports = createAction(
	async ( browser, context, page, config ) => {
		// plan step
		// TODO: use a semantic class name when we have it.
		await page.click( 'css=button.is-primary' );

		return {};
	},
	'/plans'
);
