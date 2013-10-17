define([], function() {
    var open = function(prefix) {
        return {
            save:function(key, value) {
                localStorage[prefix+key] = value
            },
            load:function(key) {
                return localStorage[prefix+key];
            },
            cd:function(directory) {
                return open(prefix+directory+'/');
            }
        }
    }
    return open('atmtg_');
});
