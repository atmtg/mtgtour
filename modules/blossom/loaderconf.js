curl({
    paths: {
	'curl/plugin': 'modules/curl/src/curl/plugin',
	less: 'modules/less.js/dist/less-1.3.1.js',
	'curl/plugin/blossom': 'blossom'
    },
    packages: {
	when: {
	    path: 'modules/when',
	    main: 'when'
	}
    }
});

define('buster', function() {
    return buster;
})

window.require = curl;


