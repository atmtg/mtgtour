define(['store'], function(store) {
    var assert = buster.assert;

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
            var subStore = store.cd("sub");
            subStore.save("hello", "brave new world");
            assert.equals(localStorage["atmtg_sub/hello"], '"brave new world"');
        },
        "can store player" : function() {
            var player = {name:"Marshall"};
            var playerStore = store.cd("players");
            playerStore.save(player.name, player);
            var loadedPlayer = playerStore.load("Marshall");
            assert.equals(player.name, loadedPlayer.name);
        },
        "can list players" : function() {
            var players = [{name:"Marshall"}, {name:"Brian"}];
            var playerStore = store.cd("players");
            _.each(players, function(player) {
                playerStore.save(player.name, player);
            });
            assert.match(playerStore.ls(), ["Brian", "Marshall"]);
        },
        "can list only player in the current store" : function() {
            store.save("fruit", "banana");
            var carStore = store.cd("cars");
            carStore.save("tractor", "Volvo");
            assert.equals(carStore.ls(), ["tractor"]);
        }
    });
});
