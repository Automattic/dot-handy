const crypto = require( 'crypto' );

// picking the free domain at the /domains step
module.exports = async ( browser, context, page, extra ) => {
	console.log( '--------- gained extra:', extra );

	// const host = ( extra.userName && extra.userName )
	// 	|| crypto.randomBytes( 64 ).toString( 'base64' );
	const host = crypto.randomBytes( 16 ).toString( 'hex' );
	const freeDomain = host + '.wordpress.com';
	await page.fill( 'css=input[type="search"]', freeDomain );
	await page.click( 'css=div[data-e2e-domain="' + freeDomain + '"] >> css=button[type="button"]' );
	await page.waitForNavigation();

	return {};
}
