define(['lodash'], function(_) {
    var open = function(prefix) {
        return {
            save:function(key, value) {
                localStorage[prefix+key] = JSON.stringify(value);
            },
            load:function(key) {
                return JSON.parse(localStorage[prefix+key]);
            },
            cd:function(directory) {
                return open(prefix+directory+'/');
            },
            ls:function() {
                return _(localStorage).
                    keys().
                    filter(function(key){return key.indexOf(prefix) === 0;}).
                    map(function(key) {return key.substr(prefix.length)}).
                    filter(function(key){return key.indexOf('/') < 0;} ).
                    sortBy().
                    valueOf();
            }
        }
    }
    return open('atmtg_');
});
