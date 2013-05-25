define(['foliage', 
        'bud', 
        'phloem', 
        'lodash', 
        'foliage/foliage-event'], 
       function(f, 
         b, 
         phloem, 
         _, 
         on) {

  var matches = [];
  var players = [];
  var matchStream = phloem.stream();
  var playerStream = phloem.stream();

  matchStream.push(matches);
  playerStream.push(players);

  function addPlayer(player) {
    players = players.concat([player]);
    playerStream.push(players);
  };

  function matchPoints(results) {
    return _.reduce(results, function(acc, val) {
      if(val.wins > val.loss) return acc + 3;
      if(val.wins == val.loss) return acc + 1;
      return acc}, 0)
  };

  function matchWinPercentage(results) {
    var playersMatchPoints = matchPoints(results);
    
    return results ? (Math.max((playersMatchPoints/(results.length * 3)), 0.33) * 100).toFixed(2) : 0;
  };

  function gameWinPercentage(results) {
    var winsAndTotal = _.reduce(results, function(acc, val) {
      acc.wins += val.wins;
      acc.total += val.wins + val.loss;
      return acc}, {wins:0, total:0})

    return winsAndTotal.total == 0 ? 0 : ((winsAndTotal.wins / winsAndTotal.total) * 100).toFixed(2);
  };
         
  function registerMatchResult(player1, player2, player1Games, player2Games, reportStream) {
    player1.results = player1.results.concat([{wins:player1Games, loss:player2Games}]);
    player1.resultStream.push(player1.results)
    if(player2) {
      player2.results = player2.results.concat([{wins:player2Games, loss:player1Games}]);
      player2.resultStream.push(player2.results)
      
      if(player1Games == player2Games) 
        reportStream.push('Draw');
      if(player1Games > player2Games) 
        reportStream.push(player1.name + ' wins <br>' + player1Games + ' - ' + player2Games);
      if(player2Games > player1Games)
        reportStream.push(player2.name + ' wins <br>' + player2Games + ' - ' + player1Games);
    } else {
      reportStream.push(player1.name + ' receives a bye');
    }
  };

  function opponentName(player1, player2, match) {
    if(player2)
      return player2.name;
    else {
      registerMatchResult(player1, player2, 2, 0, match.reportStream);
      return '- Bye -';
    }
  }

  function createMatchTables(matches) {
    var tableCount = 1;
    return f.div('#matchboard', _.map(matches, function(match) {
      var player1 = match.player1;
      var player2 = match.player2;
      return f.div('#table' + tableCount++, {'class':'matchtable'},
                   on.click(function(){
                     if(player2) {
                       $(this).find('.buttonPanel').fadeToggle();
                     }
                   }),
                   f.div({'class':'matchTableSurface'}),
                   f.p(player1.name, {'class':'playerName'}),
                   f.p(opponentName(player1, player2, match), {'class':'player2 playerName'}),
                   b.bind(match.reportStream.read, function(report) {
                     return f.div({'class':'matchResult'}, 
                                 f.span(report));
                   }),
                   f.div({'class':'buttonPanel', 'style':'display:none'},
                         f.button('2-0', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 2, 0, match.reportStream);})),
                         f.button('2-1', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 2, 1, match.reportStream);})),
                         f.button('1-1', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 1, 1, match.reportStream);})),
                         f.button('1-2', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 1, 2, match.reportStream);})),
                         f.button('0-2', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 0, 2, match.reportStream);}))
                        ))}))};

  function pairForRoundOne(players) {
    var firstHalf = players.slice(0,Math.ceil(players.length/2));
    var secondHalf = players.slice(Math.ceil(players.length/2), players.length);
    var pairings = _.zip(firstHalf, secondHalf);
    matches = _.map(pairings, function(pairing) {
      return {player1:pairing[0], player2:pairing[1], reportStream:phloem.stream()};
    });
    matchStream.push(matches);
  }
  
  return f.div(
    b.bus(function(bus) {
      return f.div('#newplayer',
                         f.input('#player_name', {'type': 'text', 
                                                  'placeholder':'Player name'}, bus.expose,
                                 on.keypress(function(event) {
                                   if(event.keyCode === 13 || event.keyCode === 10) {
                                     addPlayer({name:bus.player_name(),
                                                results:[],
                                                resultStream:phloem.stream()});
                                     $('#player_name').select();
                                   }})),
                  f.p(f.button('Pair for Round 1', {'class':'btn'},
                              on.click(function(){
                                $('#newplayer').fadeOut();
                                pairForRoundOne(players)  
                              }))))}),
    f.div('#backdrop'),
    b.bind(matchStream.read,
           function(matches) {return createMatchTables(matches)}),
    f.div('#players',
          f.div('#players_header',
                f.span('Player', {'class':'span2'}), 
                f.span('Points', {'class':'span1'}),
                f.span('MWP', {'class':'span1'}),
                f.span('GWP', {'class':'span3'})),
          b.bind(playerStream.read,
                 function(players) {
                   return f.span(_.map(players, function(player) {
                     return f.div(f.span(player.name, {'class':'span2'}), 
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchPoints(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(gameWinPercentage(results));
                                                }), {'class':'span3'})
                                 )}))})
         ))})
