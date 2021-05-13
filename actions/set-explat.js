const { createAction } = require( '../lib/action.js' );

// Set the variation of an ExPlat experiment.
module.exports = createAction(
	async ( browser, context, page, extra ) => {
		const { explatExperiments } = extra.config;

		if ( ! explatExperiments ) {
			console.error( 'No ExPlat experiments given.' );

			return {
				abort: true,
			};
		}

		for ( const instance of explatExperiments ) {
			await page.evaluate( setExperimentVariation, instance );
		}
	},
);

// Directly copied and modified from the ExPlat bookmarklet on 5.12.2021
const setExperimentVariation = async ( [ experimentSlug, variation ] ) => {
    const token = JSON.parse( localStorage.getItem( 'experiments_auth_info' ) );
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token && token.accessToken) {
        headers.Authorization = 'Bearer ' + token['accessToken'];
    }
    const response = await fetch( 'https://public-api.wordpress.com/wpcom/v2/experiments/0.1.0/assignments', {
        credentials: 'include',
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            variations: {
				[ experimentSlug ]: variation,
            }
        })
    });
    const responseBody = await response.json();
    switch ( responseBody.code ) {
        case 'variation_not_found':
            console.error( 'The variation was not found.' );
            break;
        case 'experiment_not_found':
            console.error( 'The experiment is disabled.' );
            break;
        case 'user_not_assignable':
            console.error('You must be proxied or sandboxed.');
            break;
        default:
            if ( !responseBody.variations ) {
                console.error('An unknown error occurred: ' + responseBody.message);
                break;
            }
            const duration = responseBody.duration === 'unlimited' ? responseBody.duration : Math.ceil(responseBody.duration / 60 / 60);
            if ( responseBody.storage_method === 'cookie' ) {
                window.localStorage.setItem( `explat-experiment--${experimentSlug}`, JSON.stringify( {
                    'experimentName': experimentSlug,
                    'variationName': variation,
                    'retrievedTimestamp': Date.now(),
                    'ttl': responseBody.duration === 'unlimited' ? Infinity : responseBody.duration,
                }));
                console.log(`ExPlat: Successful Assignment\n%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93\n\nExperiment: ${experimentSlug}\nVariation: ${variation}\n\nMethod: Logged-out assignment, expires in ' + duration + ' hours\nClient-side: Applies to the current domain (LocalStorage).\nServer-side: Applies to current session (Cookie).`);
            } else {
                console.log(`ExPlat: Successful Assignment\n%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93%E2%80%93\n\nExperiment: ${experimentSlug}\nVariation: ${variation}\n\nMethod: Logged-in assignment\nApplies to the current logged-in user.`);
            }
    }
};
