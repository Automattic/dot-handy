const initialize = async ( config ) => {
	const {
		browser: browserSlug,
		locale,
		rootUrl,
		cookies = [],
	} = config;

	const module = require( 'playwright' );
	const browserClass =  module[ browserSlug ];

	if ( ! browserClass ) {
		return null;
	}

	// config the browser instance
	const browser = await browserClass.launch( {
		headless: false,
	} );

	// config the context instance
	const context = await browser.newContext( {
		locale,
	} );

	await context.addCookies( [
		...cookies,
		...convertCookiesProps( config ),
	] );

	// config the page instance
	const page = await context.newPage();

	return {
		browser,
		context,
		page,
	};
};

const convertCookiesProps = ( { currency } ) => {
	const cookies = [];

	if ( currency ) {
		cookies.push( {
			name: 'landingpage_currency',
			value: currency,
			domain: '.wordpress.com',
			path: '/'
		} );
	}

	return cookies;
};

const setLocalStorage = async ( page, entries ) => {
	// TODO: better error handling
	for ( const entry of entries ) {
		await page.evaluate( ( [ key, value ] ) => {
			window.localStorage.setItem( key, value );
		}, entry );
	}
};

module.exports = {
	setLocalStorage,
	initialize,
};
