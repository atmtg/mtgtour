define(['foliage', 'bud', 'phloem', 'lodash', 'foliage/foliage-event'], function(f, b, phloem, _, on) {

  var players = [];
  var playerStream = phloem.stream();
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
                                   }})))}),
    f.div('#backdrop'),
    f.div('#players',
          f.div('#players_header',
                f.span('Player', {'class':'span2'}), 
                f.span('Points', {'class':'span1'}),
                f.span('MWP', {'class':'span1'}),
                f.span('GWP', {'class':'span1'}),
                f.span('Actions')),
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
                                                }), {'class':'span1'}),
                                  f.button('2-0', on.click(function(){
                                    player.results = player.results.concat([{wins:2, loss:0}]);
                                    player.resultStream.push(player.results)})),
                                  f.button('2-1', on.click(function(){
                                    player.results = player.results.concat([{wins:2, loss:1}]);
                                    player.resultStream.push(player.results)})),
                                  f.button('1-1', on.click(function(){
                                    player.results = player.results.concat([{wins:1, loss:1}]);
                                    player.resultStream.push(player.results)})),
                                  f.button('1-2', on.click(function(){
                                    player.results = player.results.concat([{wins:1, loss:2}]);
                                    player.resultStream.push(player.results)})),
                                  f.button('0-2', on.click(function(){
                                    player.results = player.results.concat([{wins:0, loss:2}]);
                                    player.resultStream.push(player.results)}))
                                 )}))})
         ))})
