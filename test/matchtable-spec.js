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
    
    function setUpTable(match, running, swapPlayerStream, matchStream) {
      var parent = $('<div />');
      matchtable(matchStream, [match], match, function(){return running;}, tooltip, swapPlayerStream)(parent);
      return parent;
    }
    
    function resultPresentation(result, expectedPresentation) {
      return function(done) {
        var reportStream = phloem.stream();
        var match =  {
          players: [{name: 'Marshall'}, {name: 'Brian'}],
          reportStream: reportStream
        };
        
        var tableParent = setUpTable(match, false, phloem.stream());
        reportStream.push(result);
        
        phloem.each(reportStream.read, function(val) {
          if(val) {
            assert.equals($('.matchResult span', tableParent).text().trim(), expectedPresentation);
            done();
          }
        });
      }
    }
      
    function twoPlayerRunningMatchTable() {
      var match = {
        players: [{name: 'Marshall'}, {name: 'Bwonger'}],
        reportStream: phloem.stream()
      };
      return setUpTable(match, true, phloem.stream());
    }
      
    buster.testCase('matchtable', {
      'when player2 is absent player1 receives bye' : function() {
        var match =  {
          players: [{name: 'Marshall'}, undefined],
          reportStream: phloem.stream()
        };
        
        var tableParent = setUpTable(match, false, phloem.stream());
        
        assert.equals($('.player2', tableParent).text().trim(), '- Bye -');
      },
      'presents scores when player1 wins and no draws' : resultPresentation({games1: 2, games2: 1}, '2 - 1'),
      'presents scores when tied game and no draws' : resultPresentation({games1: 1, games2: 1}, '1 - 1'),
      'presents scores when player2 wins and no draws' : resultPresentation({games1: 1, games2: 2}, '1 - 2'),
      'presents scores and draws when draws' : resultPresentation({games1: 1, games2: 1, draws:1}, '1 - 1 - 1')
    });
    buster.testCase('clicking', {
      'middle of matchtable shows right buttonpanel' : function() {  
        var tableParent = twoPlayerRunningMatchTable();
        
        $('.noMansLand', tableParent).trigger('click');
        assert.equals($('.rightButtonPanel', tableParent).css('display'), 'block');
      },
      'player2s part of table shows bottom buttonpanel' : function() {
        var tableParent = twoPlayerRunningMatchTable();
        
        $('.player2Side', tableParent).trigger('click');
        assert.equals($('.bottomButtonPanel', tableParent).css('display'), 'block');
      },
      'player1s part of table shows top buttonpanel' : function() {
        var tableParent = twoPlayerRunningMatchTable();
        
        $('.player1Side', tableParent).trigger('click');
        assert.equals($('.topButtonPanel', tableParent).css('display'), 'block');
      },
      '//another area of the table hides the other buttonPanels' : function(done) {
        this.timeout = 1000;
        var tableParent = twoPlayerRunningMatchTable();
        
        $('.topButtonPanel', tableParent).show();
        $('.player2Side', tableParent).trigger('click');
        setTimeout(function(){done(assert.equals($('.topButtonPanel', tableParent).css('display'), 'none'))}, 1000);
        //$('.player1Side', tableParent).trigger('click');
        //setTimeout(function(){assert.equals($('.bottomButtonPanel', tableParent).css('display'), 'none');}, 1000);
        //$('.noMansLand', tableParent).trigger('click');
        //setTimeout(function(){assert.equals($('.topButtonPanel', tableParent).css('display'), 'none');}, 1000);
        //$('.player1Side', tableParent).trigger('click');
        //setTimeout(function(){assert.equals($('.rightButtonPanel', tableParent).css('display'), 'none');}, 1000);
        //$('.noMansLand', tableParent).trigger('click');
        //$('.player2Side', tableParent).trigger('click');
        //setTimeout(function(){assert.equals($('.rightButtonPanel', tableParent).css('display'), 'none');}, 1000);
        //$('.noMansLand', tableParent).trigger('click');
        //setTimeout(function(){assert.equals($('.bottomButtonPanel', tableParent).css('display'), 'none');}, 1000);
      },
      'player1side when round not running will select player1' : function() {
        var match = {
          players: [{name: 'Marshall'}, {name: 'Bwonger'}],
          reportStream: phloem.stream()
        };
        var swapPlayerStream = phloem.stream();
        var tableParent = setUpTable(match, false, swapPlayerStream);
        $('.player1Side', tableParent).trigger('click');
        assert.isTrue($('.player1Side', tableParent).hasClass('selected'));
      },
      'player2side when round not running will select player2' : function() {
        var match = {
          players: [{name: 'Marshall'}, {name: 'Bwonger'}],
          reportStream: phloem.stream()
        };
        var swapPlayerStream = phloem.stream();
        var tableParent = setUpTable(match, false, swapPlayerStream);
        $('.player2Side', tableParent).trigger('click');
        assert.isTrue($('.player2Side', tableParent).hasClass('selected'));
      },
      'player1side then player2side when round not running will swap places with player1 and player2' : function (done) {
        this.timeout=1000;
        var match = {
          players: [{name: 'Marshall'}, {name: 'Bwonger'}],
          reportStream: phloem.stream()
        };
        var swapPlayerStream = phloem.stream();
        var matchStream = phloem.stream();
        var tableParent = setUpTable(match, false, swapPlayerStream, matchStream);
        when(matchStream.read.next()).then(function(matches) {
            var match = phloem.value(matches)[0];
            assert.equals(match.players[0].name, 'Bwonger');
            assert.equals(match.players[1].name, 'Marshall');
            done();
        });
        $('.player1Side', tableParent).trigger('click');
        _.defer(function() {  $('.player2Side', tableParent).trigger('click')});
       }
    });
  });

