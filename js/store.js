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
                return _.sortBy(_.map(_.keys(localStorage), function(key) {return key.substr(prefix.length)}));
            }
        }
    }
    return open('atmtg_');
});
