curl({
    paths: {
	jquery: 'ext/jquery-1.7.1.min',
	lodash: 'modules/lodash/lodash'
    }
});

define('buster', function() {
    return buster;
})

window.require = curl;


