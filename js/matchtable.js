define(['foliage', 
        'foliage/foliage-event',
        'bud',
        'phloem',
        'when',
        'seat'],
       function(f, 
         on, 
         b,
         phloem,
         when,
         seat) 
{         
         
         
         return function(matchStream, matches, match, roundTimerRunning, tooltip, swapPlayerStream) {
           var player1 = match.players[0];
           var player2 = match.players[1];

           return f.div('#table', {'class':'matchtable span3'},
                        f.div(f.div('.matchTableSurface'),
                              f.div('.player1Side', 
                                    seat(player1, 
                                         player2, 
                                         roundTimerRunning, 
                                         '.topButtonPanel',
                                         matchStream, 
                                         matches,
                                         match,
                                         swapPlayerStream,
                                         0)),
                              f.div('.noMansLand', 
                                    tooltip('If Round has Not Started; Click a Player Name to Select that Player and then another Player Name to Swap Chairs. Otherwise, Click Table to Register Match Result.'), 
                                    on.click(function() {
                                if(player2 && roundTimerRunning()) {
                                  $(this).parents('#table').find('.topButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.bottomButtonPanel').fadeOut();
                                  $(this).parents('#table').find('.rightButtonPanel').fadeToggle();}
                              }), b.bind(match.reportStream.read.next(), function(results) {
                                var reportString =  results.games1 + ' - ' + 
                                  results.games2 + 
                                  (results.draws  ? ' - ' + results.draws : '');
                                
                                return f.div('.matchResult', 
                                             f.span(reportString));
                              })),
                              f.div('.player2Side', 
                                    seat(player2, 
                                         player1, 
                                         roundTimerRunning, 
                                         '.bottomButtonPanel',
                                        matchStream,
                                        matches,
                                        match,
                                        swapPlayerStream,
                                        1))),
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
