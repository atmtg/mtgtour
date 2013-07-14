define(
    ['matchtable', 
     'jquery',
     'foliage',
     'phloem',
    'bud',
    'lodash'],
    function( matchtable, 
             $,
             f,
             phloem,
             b,
             _) {
        
        var assert = buster.assert;
        
        function tooltip() {
            return f.div();
        }

        function setUpTable(match, running) {
            var parent = $('<div />');
            matchtable(undefined, undefined, match, function(){return running;}, tooltip)(parent);
            return parent;
        }

        function resultPresentation(result, expectedPresentation) {
            return function(done) {
                var reportStream = phloem.stream();
                var match =  {
                    players: [{name: 'Marshall'}, {name: 'Brian'}],
                    reportStream: reportStream
                };

                var tableParent = setUpTable(match, false);
                reportStream.push(result);

                phloem.each(reportStream.read, function(val) {
                    if(val) {
                        assert.equals($('.matchResult span', tableParent).text().trim(), expectedPresentation);
                        done();
                    }
                });
            }
        }

        buster.testCase('matchtable', {
            'when player2 is absent player1 receives bye' : function() {
                var match =  {
                    players: [{name: 'Marshall'}, undefined],
                    reportStream: phloem.stream()
                };

                var tableParent = setUpTable(match, false);

                assert.equals($('.player2', tableParent).text().trim(), '- Bye -');
            },
            'when result is reported for match it is visible on table' : resultPresentation( 
                {games1: 2, games2: 1}, '2 - 1')
        });
    });

