// Pick the Business plan at the /plans step
module.exports = async ( browser, context, page, extra ) => {
	// plan step
	await page.click( 'css=button.is-business-plan' );
	await page.waitForNavigation();
}

