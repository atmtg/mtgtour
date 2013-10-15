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
           return function(player, otherPlayer, roundTimerRunning, scorePanel) {
               return f.div(on.click(function() {
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
                       //                                  selectOrMove(this, swapPlayerStream, playerClicked, matchStream, matches, match, 0)(); 
                   }
               }), f.p('.player1 playerName', player.name));
           }
       }
      );
