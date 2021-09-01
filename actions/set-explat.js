const { createPreparation } = require( '../lib/action.js' );

// Set the variation of an ExPlat experiment.
module.exports = createPreparation(
	async ( browser, context, page, extra ) => {
		const { explatExperiments } = extra.config;

		if ( ! explatExperiments ) {
			console.error( 'No ExPlat experiments given.' );

			return {
				abort: true,
			};
		}

		// Make sure the cookie is set before proceeding. Specifically, `tk_ai` might not be ready when we reach here.
		await page.waitForFunction( () => {
			return document.cookie !== '';
		} );

		for ( const instance of explatExperiments ) {
			const message = await page.evaluate( setExperimentVariation, instance );
			console.log( message );
		}
	},
);

// Directly copied and modified from the ExPlat bookmarklet on 8.20.2021
// In general, the updates involve:
//
// 1. Basic level prettification
// 2. Replace any `alert` and `console.xxx` as returning values. Returing error messages as return value is in general a bad function design, but
//    it is subjected to change anytime so spending time polishing it doesn't make much sense. Also,
//    I didn't touch `prompt()` because it's not clear to me if there is a proper value to hardcode there.
// 3. Replace hard-coded experiment names and variants by `experimentSlug` and `variation` variables.
const setExperimentVariation = async ( [ experimentSlug, variation ] ) => {
    const token = JSON.parse(localStorage.getItem('experiments_auth_info'));
    const anonId = decodeURIComponent(document.cookie.match('(^|;)\\s*tk_ai\\s*=\\s*([^;]+)')?.pop() || '');
    let usernameOverride = '';
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token && token.accessToken) {
        headers.Authorization = 'Bearer ' + token['accessToken'];
        usernameOverride = prompt(`This will assign a logged-in user to the ${variation} variation of pricing_page_free_vs_limited. 'You have two options:\n' + '(1) Enter a username to assign (only works for staging experiments).\n (2) Leave blank to assign yourself (works for any status).`);
    }
    const response = await fetch('https://public-api.wordpress.com/wpcom/v2/experiments/0.1.0/assignments', {
        credentials: 'include',
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            variations: {
                [ experimentSlug ]: variation,
            },
            anon_id: anonId,
            username_override: usernameOverride
        })
    });

    const responseBody = await response.json();
    switch (responseBody.code) {
        case 'variation_not_found':
            return 'The variation was not found. Please update your bookmark.';
            break;
        case 'experiment_not_found':
            return 'The experiment was not found or is disabled. Please update your bookmark.';
            break;
        case 'user_not_assignable':
            return 'You must be proxied or sandboxed to use this bookmark.';
            break;
        case 'invalid_ids':
            return 'To assign yourself or another user, you must run this from Abacus and specify an existing user.\n\n' + 'To assign the current anonymous user, verify that Tracks is not blocked and run in an environment where ' + 'the tk_ai cookie is set.';
            break;
        case 'invalid_experiment_status':
            return 'The current experiment status does not support manual assignment.';
            break;
        default:
            if (!responseBody.variations) {
                return 'An unknown error occurred: ' + responseBody.message;
                break;
            }
            const baseMessage = `ExPlat: Successful Assignment\n%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93\n\n Experiment: ${experimentSlug} \nVariation: ${variation}\n\n`;
            if (responseBody.storage_method === 'anon_sqooped_out_table') {
                return baseMessage + 'Method: Logged-out assignment\nApplies to the current anon user (tk_ai cookie).';
            } else {
                const appliedUserDesc = usernameOverride || 'the current logged-in user';
                return baseMessage + 'Method: Logged-in assignment\nApplies to ' + appliedUserDesc + '.';
            }
    }
};
