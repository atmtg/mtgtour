define(['lodash'], function(_) {
    var open = function(prefix) {
        return {
            save:function(key, value) {
                localStorage[prefix+key] = JSON.stringify(value);
            },
            load:function(key) {
                var content = localStorage[prefix+key];
                return content && JSON.parse(content);
            },
            subStore:function(directory) {
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
            },
            rm:function(key) {
              return localStorage.removeItem(prefix+key);
            }
        }
    }
    return open('atmtg_');
});
