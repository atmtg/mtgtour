curl({
    baseUrl: 'js',
    paths: {
        'test': '../test',
        'jquery': 'ext/jquery-1.8.2',
        'curl/plugin/twig': '../modules/twig/twig',
        'curl/plugin/css': '../modules/curl/src/curl/plugin/css',
	'curl/plugin/js': '../modules/curl/src/curl/plugin/js',
	'curl/plugin/text': '../modules/curl/src/curl/plugin/text',
	'bootstrap/css': '../modules/bootstrap/docs/assets/css',
	'bootstrap/less': '../modules/bootstrap/less',
	'bootstrap/less/variables.less': '../less/variables.less',
	'bootstrap/less/type.less': '../less/type.less',
	'less': '../modules/less/dist/less-1.3.3.js',
	'style': '../less'
    },
    packages: {
	'lodash': {
	    'location':'../modules/lodash',
	    'main':'lodash'
	},
	'blossom': {
	    'location':'../modules/blossom',
	    'main':'blossom'
	},
	'phloem': {
	    'location':'../modules/phloem',
            'main':'phloem'
        },
        'bud': {
            'location':'../modules/bud',
            'main':'bud'
        },
        'foliage' : {
            'location':'../modules/foliage',
            'main':'foliage'

        },
        'when' : {
            'location': '../modules/when',
            'main': 'when'
        }
    }
});

window.require = curl;
