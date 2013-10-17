define([], function() {
    var PREFIX = 'atmtg_';
    return {
        
        save:function(key, value) {
            localStorage[PREFIX+key] = value
        },
        load:function(key) {
            return localStorage[PREFIX+key];
        }
    };
});
