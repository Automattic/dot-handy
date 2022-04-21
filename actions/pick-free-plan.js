const { createAction } = require( '../lib/action' );

// Pick the Free plan at the /plans step
module.exports = createAction(
	async ( browser, context, page ) => {
		// Terrible, but it is what it is before a more semantic structure is introduced.
		await page.click( 'text=Start with Free' );

		return {};
	},
	'/plans'
);
