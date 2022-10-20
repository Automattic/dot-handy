const { createAction, abort } = require( '../lib/action.js' );

module.exports = createAction(
	async ( browser, context, page, config, accum, args ) => {
		await page.click( 'css=button.intro__button' );

		return {};
	},
);
