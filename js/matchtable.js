define(['foliage', 
        'foliage/foliage-event',
        'bud'],
       function(f, 
                on, 
                b) {
    var opponentName = function (player2) {
        return player2 ? player2.name : '- Bye -';
    };

    function onClickSelectOrMove(matchStream, matches, match, playerIndex) {
        return on.click(function() {
            if(!roundTimerRunning()) {
                if(playerSelected) {
                    var tempPlayer = match.players[playerIndex];
                    match.players[playerIndex] = playerSelected.theMatch.players[playerSelected.thePlayerIndex];
                    playerSelected.theMatch.players[playerSelected.thePlayerIndex] = tempPlayer;
                    
                    cleanUpMatch(matches, match);
                    cleanUpMatch(matches, playerSelected.theMatch);
                    
                    playerSelected = undefined;
                    matchStream.push(matches);
                } else {
                    playerSelected = {theMatch:match, thePlayerIndex:playerIndex};
                } 
                $(this).toggleClass('selected');
            }
        });
    };

    return function(matchStream, matches, match, roundTimerRunning, tooltip) {
        var player1 = match.players[0];
        var player2 = match.players[1];
        return f.div('#table', {'class':'matchtable span3'},
                   tooltip('Click Table to Register Match Result. \nTo Adjust Pairing: Click a Player Name to Select that Player, and then another Player Name to Switch Chairs.'),
                   on.click(function(){
                     if(player2 && roundTimerRunning()) {
                       $(this).find('.buttonPanel').fadeToggle();
                     }
                   }),
                   f.div(f.div('.matchTableSurface'),
                         f.p('.player1 playerName', player1.name, onClickSelectOrMove(matchStream, matches, match, 0)),
                         f.p('.player2 playerName', opponentName(player2), 
                             onClickSelectOrMove(matchStream, matches, match, 1)),
                         b.bind(match.reportStream.read, function(report) {
                           return f.div('.matchResult', 
                                        f.span(report));
                         })),
                   f.div('.buttonPanel', {'style':'display:none'},
                         f.button('.btn', '2-0', on.click(function(){
                           registerMatchResult(player1, player2, 2, 0, match);})),
                         f.button('.btn', '2-1', on.click(function(){
                           registerMatchResult(player1, player2, 2, 1, match);})),
                         f.button('.btn', '1-1', on.click(function(){
                           registerMatchResult(player1, player2, 1, 1, match);})),
                         f.button('.btn', '1-2', on.click(function(){
                           registerMatchResult(player1, player2, 1, 2, match);})),
                         f.button('.btn', '0-2', on.click(function(){
                           registerMatchResult(player1, player2, 0, 2, match);}))));
    };
});
