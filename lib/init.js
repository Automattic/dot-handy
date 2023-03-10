const { getRootUrlFromEnv } = require( './misc.js' );

const initialize = async ( config ) => {
	const {
		browser: browserSlug,
		locale,
		rootUrl,
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

	// config the page instance
	const page = await context.newPage();

	return {
		browser,
		context,
		page,
		config,
	};
};

const postFirstNavigationSetup = async ( { context, page, config } ) => {
	let needReload = false;

	const cookies = [
		...( config.cookies ? config.cookies : [] ),
		...convertCookiesProps( config ),
	];

	// it looks like context-wise cookies are enough for wp.com for now.
	// when we need page-wise cookies, `needReload` will need to set as true for that.
	if ( cookies.length !== 0 ) {
		await context.addCookies( [
			...cookies,
			...convertCookiesProps( config ),
		] );
	}

	if ( config.localStorage ) {
		await setLocalStorage( page, config.localStorage );

		needReload = true;
	}

	if ( needReload ) {
		await page.reload();
	}
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

const findFirstPath = ( actions ) => {
	for ( const action of actions ) {
		if ( ! action.isPreparation && action.initialPath ) {
			return action.initialPath;
		}
	}

	return '/';
}

const goToStartUrl = async ( runEnv, actions ) => {
	const { page, config } = runEnv;
	const beginningPath = findFirstPath( actions );

	return await page.goto( getRootUrlFromEnv( config.env ) + beginningPath );
};

module.exports = {
	initialize,
	goToStartUrl,
	postFirstNavigationSetup,
};
