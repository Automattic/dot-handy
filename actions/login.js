const { createAction } = require( '../lib/action.js' );

// login as a test username.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		const { username, password } = extra.config;

		if ( ! username || ! password ) {
			console.error( 'Please supply the login credentials via `username` and `password` config fields. Try create a local config file under `/local-configs` with these fields and supply it through -C.' );

			return {
				abort: true,
			};
		}

		await page.fill( 'css=input#usernameOrEmail', username );
		await page.click( 'css=button[type="submit"]' );

		await page.fill( 'css=input#password', password );
		await page.click( 'css=button[type="submit"]' );

		return {};
	},
	'/log-in'
);
