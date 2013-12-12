define(['foliage', 
        'foliage/foliage-event',
        'bud',
        'phloem',
        'when'],
       function(f, 
         on, 
         b,
         phloem,
         when) 
{
         var opponentName = function (player2) {
           return player2 ? player2.name : '- Bye -';
         };
         
         var parseResultString = function(player1, player2, results) {
           var reportString = "";
           if(!player2) {
             reportString = "- Bye -<br>";
           } else if(results.games1 > results.games2) {
             reportString = player1.name + " Wins<br>";
           } else if(results.games2 > results.games1) {
             reportString = player2.name + " Wins<br>";
           } else {
             reportString = "Draw<br>";
           }
           reportString += '(' + results.games1 + ' - ' + 
             results.games2 + 
             (results.draws  ? ' - ' + results.draws : '') + ')';
           return reportString;
         };

         function selectOrMove(element, swapPlayerStream, playerClicked, matchStream, matches, match, playerIndex) {
           return function(event) {
             var changeTo = when.defer();
             if(playerClicked){
                 playerClicked.swapTo(match.players[playerIndex]);
                 match.players[playerIndex] = playerClicked.player;
                 swapPlayerStream.push(undefined);
             }
             else {
                 swapPlayerStream.push({player:match.players[playerIndex], swapTo:changeTo.resolve}); 
                 when(changeTo.promise).then(function(newPlayer){
                     match.players[playerIndex] = newPlayer;
                     matchStream.push(matches);
                 });
             }
             $(element).toggleClass('selected');                      
           }};
      
         function hideAllButtons() {
           $('.matchtable').each(function() {$(this).find('.rightButtonPanel').fadeOut()});
           $('.matchtable').each(function() {$(this).find('.bottomButtonPanel').fadeOut()});
           $('.matchtable').each(function() {$(this).find('.topButtonPanel').fadeOut()});
         }

         function toggleShowButtonPanels(element) {
           var currentlyVisible = $(element).parents('#table').find('.topButtonPanel').is(':visible');
           hideAllButtons();
           if(!currentlyVisible) {
             $(element).parents('#table').find('.topButtonPanel').fadeToggle();
             $(element).parents('#table').find('.rightButtonPanel').fadeToggle();
             $(element).parents('#table').find('.bottomButtonPanel').fadeToggle();
           };
         }
  
         return function(matchStream, matches, match, roundTimerRunning, tooltip, swapPlayerStream) {
           var player1 = match.players[0];
           var player2 = match.players[1];
           var playerClicked;
           phloem.each(swapPlayerStream.read.next(), function(player) {
             playerClicked = player;
           });
           phloem.each(match.reportStream.read.next(), function(ignore) {
             hideAllButtons();
           });
           
           return f.div('#table', {'class':'matchtable span3'},
                        f.div(f.div('.matchTableSurface'),
                              f.div('.player1Side', on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  toggleShowButtonPanels(this);
                                } else {
                                  selectOrMove(this, swapPlayerStream, playerClicked, matchStream, matches, match, 0)();
                                }
                              }), f.p('.player1 playerName', player1.name)),
                              f.div('.noMansLand', 
                                    tooltip('If Round has Not Started; Click a Player Name to Select that Player and then another Player Name to Swap Chairs. Otherwise, Click Table to Register Match Result.'), 
                                    on.click(function() {
                                      if(player2 && roundTimerRunning()) {
                                        toggleShowButtonPanels(this);
                                      } 
                                    }), b.bind(match.reportStream.read.next(), function(results) {                             
                                      return f.div('.matchResult', 
                                                   f.span(parseResultString(player1, player2, results)));
                                    })),
                              f.div('.player2Side', on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  toggleShowButtonPanels(this);
                                } else if (player2){
                                  selectOrMove(this, swapPlayerStream, playerClicked, matchStream, matches, match, 1)();
                                }
                              }), f.p('.player2 playerName', opponentName(player2)))),
                        f.div('.topButtonPanel', {'style':'display:none'},
                              f.button('.btn', '2-0', on.click(function(){
                                match.registerResult( 2, 0);})),
                              f.button('.btn', '2-1', on.click(function(){
                                match.registerResult( 2, 1);})),
                              f.button('.btn', '1-0', on.click(function(){
                                match.registerResult( 1, 0);}))),
                        f.div('.rightButtonPanel btn-group-vertical', {'style':'display:none'}, 
                              f.button('.btn', {'style':'width:5em'},
                                       '0-0', on.click(function(){
                                         match.registerResult( 0, 0);})),
                              f.button('.btn', {'style':'width:5em'},
                                       '1-1', on.click(function(){
                                         match.registerResult( 1, 1);})),
                              f.button('.btn', {'style':'width:5em'},
                                       'x-y-1', on.click(function(){
                                         match.registerDraw(1);})),
                              f.button('.btn', {'style':'width:5em'}, 
                                       'x-y-2', on.click(function(){
                                         match.registerDraw(2);})),
                              f.button('.btn', {'style':'width:5em'}, 
                                       'x-y-3', on.click(function(){
                                         match.registerDraw(3);}))),
                        f.div('.bottomButtonPanel', {'style':'display:none'},
                              f.button('.btn', '2-0', on.click(function(){
                                match.registerResult( 0, 2);})),
                              f.button('.btn', '2-1', on.click(function(){
                                match.registerResult( 1, 2);})),
                              f.button('.btn', '1-0', on.click(function(){
                                match.registerResult( 0, 1);}))));
         };
       })
