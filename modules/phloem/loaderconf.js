curl({
    baseUrl: '.',

    paths: {
	'phloem' : 'phloem',
    },
    packages: {
        'when' : {
            'location': 'modules/when',
            'main': 'when'
        },
        'lodash' : {
            'location': 'modules/lodash',
            'main': 'lodash'
        }
    }
});
window.require = curl;

