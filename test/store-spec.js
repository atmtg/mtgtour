define(['store'], function(store) {
    var assert = buster.assert;

    buster.testCase("store", {
        setUp:function() {
            localStorage.clear();
        },
        "stores string in root" : function() {
            store.save("hello", "world");
            assert.equals(localStorage["atmtg_hello"], "world"); 
        },

        "loads stored string in root" : function() {
            store.save("bye", "cruel world");
            assert.equals(store.load("bye"), "cruel world"); 
        }
    });
});
