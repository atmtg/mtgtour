define(['foliage', 
        'foliage/foliage-event',
        'bud'],
       function(f, 
         on, 
         b) 
{
         var opponentName = function (player2) {
           return player2 ? player2.name : '- Bye -';
         };
         
         function selectOrMove(selectionQueue, matchStream, matches, match, playerIndex) {
           return function() {
             console.log(selectionQueue)
             when(selectionQueue.read).then(function() {
               var selectedPlayer = selectionQueue.read();
               var tempPlayer = match.players[playerIndex];
               match.players[playerIndex] = selectedPlayer.theMatch.players[selectedPlayer.thePlayerIndex];
               selectedPlayer.theMatch.players[selectedPlayer.thePlayerIndex] = tempPlayer;
               
               cleanUpMatch(matches, match);
               cleanUpMatch(matches, selectedPlayer.theMatch);
               
               matchStream.push(matches);
               selectionQueue.clear();
             }).otherwise(function() {
               selectionQueue.set({theMatch:match, thePlayerIndex:playerIndex});
             });
             $(this).toggleClass('selected');               
           }};
         
         
         return function(matchStream, matches, match, roundTimerRunning, tooltip, selectionQueue) {
           var player1 = match.players[0];
           var player2 = match.players[1];
           var currentResult = {games1:0, games2:0};
           return f.div('#table', {'class':'matchtable span3'},
                        tooltip('Click Table to Register Match Result. \nTo Adjust Pairing: Click a Player Name to Select that Player, and then another Player Name to Switch Chairs.'),
                        f.div(f.div('.matchTableSurface'),
                              f.div('.player1Side', on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  $(this).parents('#table').find('.rightButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.bottomButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.topButtonPanel').fadeToggle();
                                } else {
                                  selectOrMove(selectionQueue, matchStream, matches, match, 0)();
                                }
                              }), f.p('.player1 playerName', player1.name)),
                              f.div('.noMansLand', on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  $(this).parents('#table').find('.topButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.bottomButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.rightButtonPanel').fadeToggle();}
                              }), b.bind(match.reportStream.read, function(results) {
                                var reportString = "";
                                
                                if(results) {
                                  currentResult = results;
                                  reportString =  results.games1 + ' - ' + 
                                    results.games2 + 
                                    (results.draws  ? ' - ' + results.draws : '');
                                }
                                return f.div('.matchResult', 
                                             f.span(reportString));
                                
                              })),
                              f.div('.player2Side', on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  $(this).parents('#table').find('.topButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.rightButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.bottomButtonPanel').fadeToggle();
                                } else if (player2){
                                  selectOrMove(selectionQueue, matchStream, matches, match, 1);
                                }
                              }), f.p('.player2 playerName', opponentName(player2)))),
                        f.div('.topButtonPanel', {'style':'display:none'},
                              f.button('.btn', '2-0', on.click(function(){
                                match.registerResult( 2, 0);})),
                              f.button('.btn', '2-1', on.click(function(){
                                match.registerResult( 2, 1);})),
                              f.button('.btn', '1-0', on.click(function(){
                                match.registerResult( 1, 0);}))),
                        f.div('.rightButtonPanel', {'style':'display:none'}, 
                              f.button('.btn', '0-0-z', on.click(function(){
                                match.registerResult( 0, 0);})),
                              f.button('.btn', '1-1-z', on.click(function(){
                                match.registerResult( 1, 1);})),
                              f.button('.btn', 'x-y-1', on.click(function(){
                                match.registerDraw(1);})),
                              f.button('.btn', 'x-y-2', on.click(function(){
                                match.registerDraw(2);})),
                              f.button('.btn', 'x-y-3', on.click(function(){
                                match.registerDraw(3);}))),
                        f.div('.bottomButtonPanel', {'style':'display:none'},
                              f.button('.btn', '0-1', on.click(function(){
                                match.registerResult( 0, 1);})),
                              f.button('.btn', '1-2', on.click(function(){
                                match.registerResult( 1, 2);})),
                              f.button('.btn', '0-2', on.click(function(){
                                match.registerResult( 0, 2);}))));
         };
       })
