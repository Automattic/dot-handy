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
			type: 'string',
		} )
		.option( 'action-files', {
			alias: 'A',
			type: 'string',
		} )
		.argv;

	// FIXME: too ugly
	const configFiles = argv.configFiles && argv.configFiles.split( ',' ) || [];
	const actionFiles = argv.actionFiles && argv.actionFiles.split( ',' ) || [];

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

	console.log( '------ Configuration:\n', unionConfig );

	const actions = readActionFiles( actionFiles );

	if ( ! actions ) {
		process.exit( -1 );
	}

	console.log( '------ Series of action scripts that will be performing:\n' );
	console.log( actionFiles );

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
