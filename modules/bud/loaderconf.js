curl({
    paths: {
	jquery: 'ext/jquery-1.8.2',
	'curl/plugin': 'modules/curl/src/curl/plugin'
    },
    packages : {
	when: {
	    path: 'modules/when',
	    main: 'when'
	},
	lodash: {
	    path: 'modules/lodash',
	    main: 'lodash'
	},
	foliage: {
	    path: 'modules/foliage',
	    main: 'foliage'
	},
	phloem: {
	    path: 'modules/phloem',
	    main: 'phloem'
	}
    }
});

window.require = curl;
