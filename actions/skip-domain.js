const { createAction } = require( '../lib/action' );
const { generateRandomString } = require( '../lib/misc' );

module.exports = createAction(
	async ( browser, context, page ) => {
		const host = generateRandomString( 16 );
		const freeDomain = host + '.wordpress.com';

		// TODO: make this locale-agnostic
		await page.click( 'text=Decide later' );

		return {};
	},
	'/domains'
);
