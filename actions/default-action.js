const { createAction } = require( '../lib/action.js' );

// A default config that does nothing but navigating. Sometimes it's useful to just have a browser instance configured without any automated action.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		if ( extra.unionConfig.path ) {
			await page.goto( extra.unionConfig.path );
		}

		return {};
	},
	'/'
);
