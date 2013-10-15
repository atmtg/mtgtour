define(['foliage',
        'foliage/foliage-event',
        'phloem',
        'bud',
        'when',
        'lodash'], 
       function(f,
                on,
                phloem,
                bud,
                when,
                _) {
           
           var scorePanels = ['.rightButtonPanel', 
                              '.bottomButtonPanel', 
                              '.topButtonPanel'];
           var nameOrBye = function (player) {
               return player ? player.name : '- Bye -';
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
                           $(element).toggleClass('selected');                      
                           matchStream.push(matches);
                       });
                   }
                   $(element).toggleClass('selected');                      
               }};
           

           return function(player, 
                           otherPlayer,
                           roundTimerRunning, 
                           scorePanel, 
                           matchStream, 
                           matches,
                           match, 
                           swapPlayerStream,
                           playerIndex) {
               var playerForSwap;
               phloem.each(swapPlayerStream.read.next(), function(swapTo) {
                   playerForSwap = swapTo;
               });

               return f.div('.seat', on.click(function() {
                   if(otherPlayer && roundTimerRunning()) {
                       var self = this;
                       _.each(scorePanels, function(panel) {
                           var panelElement = $(self).parents('#table').find(panel);
                           if(panel === scorePanel){
                               panelElement.fadeToggle();
                           }
                           else {
                               panelElement.fadeOut();
                           }
                       });
                   } else {
                       selectOrMove(this, 
                                    swapPlayerStream, 
                                    playerForSwap, 
                                    matchStream,
                                    matches,
                                    match,
                                    playerIndex)(); 
                   }
               }), f.p('.player1 playerName', nameOrBye(player)));
           }
       }
      );
