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
      return acc}, 0)};

  return f.div(
    b.bus(function(bus) {
            return f.div('#newplayer',
                         f.input('#player_name', {'type': 'text', 
                                                  'placeholder':'Player name', 
                                                  'class':'span2',
                                                  'style':'height:30px'}, bus.expose),
                         f.button('Register', {'class':'btn'}, 
                                  on.click(function(){addPlayer({name:bus.player_name(),
                                                          results:[],
                                                          resultStream:phloem.stream()})})))}),
    f.div('#players',
          f.div('#players_header',
                f.span('Player', {'class':'span2'}), 
                f.span('Points')),
          b.bind(playerStream.read,
                 function(players) {
                   return f.span(_.map(players, function(player) {
                     return f.div(f.span(player.name, {'class':'span2'}), 
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchPoints(results));
                                                })),
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
