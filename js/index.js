define(['foliage', 'bud', 'phloem', 'lodash', 'foliage/foliage-event'], function(f, b, phloem, _, on) {

  var players = [];
  var playerStream = phloem.stream();
  playerStream.push(players);

  function addPlayer(player) {
    players = players.concat([player]);
    playerStream.push(players);
  };

  function matchPoints(results) {
    return _.reduce(results, function(acc, val) {return acc + (val.win * 3) + val.draw}, 0);
  };

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
                f.span('Match points')),
          b.bind(playerStream.read,
                 function(players) {
                   return f.span(_.map(players, function(player) {
                     return f.div(f.span(player.name, {'class':'span2'}), 
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchPoints(results));
                                                }
                                                )),
                                  f.button('add win', on.click(function(){
                                    player.results = player.results.concat([{win:1, draw:0}]);
                                    player.resultStream.push(player.results)})),
                                  f.button('add draw', on.click(function(){
                                    player.results = player.results.concat([{win:0, draw:1}]);
                                    player.resultStream.push(player.results)}))
                                 )}))})
         ))})
