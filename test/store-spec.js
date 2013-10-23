define(['store'], function(store) {
    var assert = buster.assert;
    var refute = buster.refute;

    buster.testCase("store", {
        setUp:function() {
            localStorage.clear();
        },
        "stores string in root" : function() {
            store.save("hello", "world");
            assert.equals(localStorage["atmtg_hello"], '"world"'); 
        },
        "loads stored string in root" : function() {
            store.save("bye", "cruel world");
            assert.equals(store.load("bye"), "cruel world"); 
        },
        "stores string in substore" : function() {
            var subStore = store.subStore("sub");
            subStore.save("hello", "brave new world");
            assert.equals(localStorage["atmtg_sub/hello"], '"brave new world"');
        },
        "can store player" : function() {
            var player = {name:"Marshall"};
            var playerStore = store.subStore("players");
            playerStore.save(player.name, player);
            var loadedPlayer = playerStore.load("Marshall");
            assert.equals(player.name, loadedPlayer.name);
        },
        "can list players" : function() {
            var players = [{name:"Marshall"}, {name:"Brian"}];
            var playerStore = store.subStore("players");
            _.each(players, function(player) {
                playerStore.save(player.name, player);
            });
            assert.match(playerStore.ls(), ["Brian", "Marshall"]);
        },
        "can list only items in the current store" : function() {
            store.save("fruit", "banana");
            var carStore = store.subStore("cars");
            carStore.save("tractor", "Volvo");
            assert.equals(carStore.ls(), ["tractor"]);
        },
        "can list only items in the current store and ignore substores" : function() {
            store.save("fruit", "banana");
            var carStore = store.subStore("cars");
            carStore.save("tractor", "Volvo");
            assert.equals(store.ls(), ["fruit"]);
        },
        "can remove items" : function() {
            store.save("fruit", "banana");
            store.rm("fruit");
            assert.equals(store.ls(), []);
        },
        "can remove specific item" : function() {
            store.save("fruit", "banana");
            store.save("other_fruit", "apple");
            store.rm("other_fruit");
            assert.equals(store.ls(), ["fruit"]);
        },
        "can load non-existing key" : function() {
            var undef = store.load("non-existing-key");
            refute.defined(undef);
        }
    });
});
