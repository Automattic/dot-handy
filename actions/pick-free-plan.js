// Pick the Free plan at the /plans step
module.exports = async ( browser, context, page, extra ) => {
	await page.click( 'css=#step-header >> css=button[type="button"]' );
	await page.waitForNavigation();

	return {}
}
