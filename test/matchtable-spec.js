define(
    ['buster',
     'matchtable', 
     'jquery',
     'foliage',
     'phloem'],
    function(buster, 
             matchtable, 
             $,
             f,
             phloem) {
        
        var assert = buster.assert;
        
        function tooltip() {
            return f.div();
        }

        function setUpTable(match, running) {
            var parent = $('<div />');
            matchtable(undefined, undefined, match, function(){return running;}, tooltip)(parent);
            return parent;
        }

        buster.testCase('matchtable', {
            'when player2 is absent player1 receives bye' : function() {
                var match =  {
                    players: [{name: 'Marshall'}, undefined],
                    reportStream: phloem.stream()
                };

                var tableParent = setUpTable(match, false);

                assert.equals($('.player2', tableParent).text().trim(), '- Bye -');
                
            }
        });
    });
