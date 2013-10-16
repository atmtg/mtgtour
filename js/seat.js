define(['foliage',
        'foliage/foliage-event',
        'phloem',
        'bud',
        'when',
        'lodash',
        'jquery'], 
       function(f,
         on,
         phloem,
         b,
         when,
         _,
         $) 
{
  var scorePanels = ['.rightButtonPanel', 
                     '.bottomButtonPanel', 
                     '.topButtonPanel'];
  var nameOrBye = function (player) {
    return player ? player.name : '- Bye -';
  };
  
  return function(player, 
           otherPlayer,
           roundTimerRunning, 
           scorePanel, 
           matchStream, 
           matches,
           match, 
           playerToSwap,
           playerIndex) {
    
    return b.whenever(playerToSwap.read).then(function(playerForSwap) {
      return f.div(
        playerForSwap.player === player ? '.selected' : undefined,
        '.seat', on.click(function() {
          match.players[playerIndex] = playerForSwap.player;
          playerForSwap.swapTo(player);
        }), f.p('.playerName', 
                'swap',
                nameOrBye(player),
                'to',
                playerForSwap.player.name))}).
      otherwise(function() {
        return f.div('.seat', on.click(function(){
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
            var eventuallySwap = when.defer();
            playerToSwap.set({
              player: player,
              swapTo: eventuallySwap.resolve
            });
            when(eventuallySwap.promise).then(function(newPlayer){
              match.players[playerIndex] = newPlayer;
              matchStream.push(matches);
              playerToSwap.clear();
            });
          }
        }), f.p('.playerName', nameOrBye(player)));
      });}
});
