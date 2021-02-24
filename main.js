/**
 * External dependencies
 */
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const { readConfigFiles, readActionFiles, initialize } = require( './lib/init.js' );

const parseCommandLine = () => {
	const argv = yargs
		.option( 'config-files', {
			alias: 'C',
			default: '',
			type: 'string',
		} )
		.option( 'action-files', {
			alias: 'A',
			default: '',
			type: 'string',
		} )
		.argv;

	const configFiles = argv.configFiles.split( ',' );
	const actionFiles = argv.actionFiles.split( ',' );

	return {
		configFiles,
		actionFiles,
	};
};

const main = async () => {
	const {
		configFiles,
		actionFiles,
	} = parseCommandLine();

	const unionConfig = readConfigFiles( [
		'default-config',
		...configFiles,
	] );

	if ( ! unionConfig ) {
		process.exit( -1 );
	}

	console.log( '------ The configuration: ', unionConfig );

	const actions = readActionFiles( actionFiles );

	if ( ! actions ) {
		process.exit( -1 );
	}

	const {
		browser,
		context,
		page,
	} = await initialize( unionConfig );

	const extra = {};
	for ( const action of actions ) {
		const newExtra = await action( browser, context, page, extra )
		Object.assign( extra, newExtra );
	}
}

main();

// main();

// ( async () => {
// 	const browser = await chromium.launch( {
// 		headless: false,
// 	} );
// 	const context = await browser.newContext( {
// 		locale: 'en',
// 	} );
// 	const page = await context.newPage();
//
// 	await page.goto( 'https://wordpress.com/start' );
// 	// await page.goto( 'http://calypso.localhost:3000/start' );
//
// 	// domain step
// 	const freeDomain = userName + '.wordpress.com';
// 	await page.fill( 'css=input[type="search"]', freeDomain );
// 	await page.click( 'css=div[data-e2e-domain*="' + freeDomain + '" >> css=button[type="button"]' );
//
// 	await page.waitForNavigation();
//
// 	// plan step
// 	await page.click( 'css=.plans-features-main__banner-content >> css=button[type="button"]' );
// 	await page.waitForNavigation();
// } )();
