const { createAction } = require( '../lib/action.js' );

// remove a purchase from a logged-in account
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		return {};
	},
	'/me/purchases'
);
