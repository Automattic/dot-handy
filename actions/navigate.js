const { createAction } = require( '../lib/action.js' );
const { getRootUrlFromEnv } = require( '../lib/misc.js' );

// A default config that does nothing but navigating. Sometimes it's useful to just have a browser instance configured without any automated action.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		const { env, path } = extra.config;

		if ( path ) {
			await page.goto( getRootUrlFromEnv( env ) + path );
		}

		return {};
	},
);
