// creating a new user at the /user step
module.exports = async ( browser, context, page, extra ) => {
	const randSerial = Math.floor( 10000000000 * Math.random() ) + 65535;
	const email = 'southptest2+' + randSerial + '@gmail.com';
	const userName = 'southptest' + randSerial;
	const password = 'SouthpTest1984';

	await page.fill( 'css=input#email', email );
	await page.fill( 'css=input#username', userName );
	await page.fill( 'css=input#password', password );
	await page.click( 'css=button[type="submit"]' );

	console.log( '------ user created:', userName, password );

	await page.waitForNavigation();

	return {
		userName,
	};
}
