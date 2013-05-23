define(['foliage', 'bud', 'phloem', 'lodash', 'foliage/foliage-event'], function(f, b, phloem, _, on) {

  var players = [];
  var playerStream = phloem.stream();
  playerStream.push(players);

  function addPlayer(player) {
    players = players.concat([player]);
    playerStream.push(players);
  };

  return f.div(
    f.div('#players',
          b.bind(playerStream.read,
                 function(players) {
                   return f.span(_.map(players, function(player) {
                     return f.div(f.p(player.name))}
                     ))}),
          b.bus(function(bus) {
            return f.div('#newplayer',
                  f.input('#player_name', {type: 'text'}, bus.expose),
                         f.button('new player', on.click(function(){addPlayer({name:bus.player_name()})})))})
));});
