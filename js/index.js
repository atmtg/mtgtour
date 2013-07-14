define(['foliage', 
        'bud', 
        'phloem', 
        'lodash', 
        'foliage/foliage-event',
        'statistics',
        'pairing',
        'matchtable'], 
       function(f, 
         b, 
         phloem, 
         _, 
         on,
         stats,
         pair,
         matchTable) {

  var NUM_ROUNDS = 3;
  var ROUND_TIME = 3600;

  var players = [];
  var matchStream = phloem.stream(), playerStream = phloem.stream();
  var roundReportStream = phloem.stream();
  
  var roundTimerId, roundNumber = 1;
  var playerSelected;

  matchStream.push([]);
  playerStream.push(players);

  var tooltip = function(text) {
    return function(parent) {
      parent.attr('title', text);
      parent.tooltip();
      return {undo:function(){}}
    }
  }

  var roundTimerRunning = function() {
    return roundTimerId != undefined;
  };

  function addPlayer(player) {
    players = players.concat([player]);
    playerStream.push(players);
  };
         
  var matchPoints = stats.matchPoints;
  var matchWinPercentage = stats.matchWinPercentage; 
  var gameWinPercentage = stats.gameWinPercentage;
  var opponentsMatchWinPercentage = stats.opponentsMatchWinPercentage;
  var opponentsGameWinPercentage = stats.opponentsGameWinPercentage;

  var matchLog = function (results) {
    var matchLogString = '';
    _.each(results, function(result) {
      if(result.opponent) {
        matchLogString += result.opponent.name + ' (' + 
          result.wins + '-' + result.loss + '), '
      } else {
        matchLogString += '- Bye -, ';
      }
    });
    return matchLogString;
  }

  function sortPlayers(players) {
    players.sort(function(a, b) {
      if(matchPoints(b.results) == matchPoints(a.results)) {
        if(opponentsMatchWinPercentage(b.results) == 
           opponentsMatchWinPercentage(a.results)) {
          if(gameWinPercentage(b.results) == gameWinPercentage(a.results)) {
            return opponentsGameWinPercentage(b.results) -
              opponentsGameWinPercentage(a.results);
          } else {
            return gameWinPercentage(b.results) - gameWinPercentage(a.results);
          };
        } else {
          return opponentsMatchWinPercentage(b.results) - 
            opponentsMatchWinPercentage(a.results);
        };
      } else {
        return matchPoints(b.results) - matchPoints(a.results);
      };
    });

    return players;
  };

  function handleRound(matches) {
    _.each(matches, function(match) {
      if(!match.players[1]) {
        match.registerResult( 2, 0);
      }
    })

    var start = new Date().getTime();
    roundTimerId = window.setInterval(function() {
      var elapsed = new Date().getTime() - start;
      var timeLeft = ROUND_TIME - Math.floor(elapsed/1000);
      
      var allMatchesFinished = true;
      _.map(matches, function(match) {
        allMatchesFinished &= (match.result !== undefined);
      })

      roundReportStream.push({time:timeLeft, 
                              roundFinished:allMatchesFinished, 
                              tournamentResult:undefined,
                              matches:matches})
    }, 1000);
  }

  function roundReportPanel(roundReport) {
    if(typeof roundReport == 'undefined' || roundReport.tournamentResult) return f.div();

    var minutes = roundReport.time/60 < 10 ? '0' + 
      Math.floor(roundReport.time/60) : Math.floor(roundReport.time/60);
    var seconds = roundReport.time%60 < 10 ? '0' + 
      roundReport.time%60 : roundReport.time%60;
      
    return f.div('#roundPanel', 
                 f.div('#roundTitle', f.span('Round ' + roundNumber)),
                 f.div('#roundTimer', 
                       f.span(roundReport.time <= 0 ? 'TIME' : minutes + ':' + seconds, 
                              {'class': roundReport.time <= 0 ? 'timerEnded' : ''}),
                       f.div('.progress progress-striped',
                             {'class':roundReport.time < 180 ? 'progress-danger' : 
                              roundReport.time < 600 ? 'progress-warning' : 'progress-success'},
                             f.div('.bar', {'style':'width:' + (roundReport.time/ROUND_TIME)*100 + '%' }))));
  }

  function buttonToStartRound(matches) {
    return _.size(matches) > 0 ? f.div(
      f.button('.btn roundButton',
               'Start round',
               on.click(function(){
                 handleRound(matches);
                 $(this).fadeOut();
               }))) : f.div();
  };

  function buttonToFinishRoundAndPairNext(roundReport) {
    return roundReport && roundReport.roundFinished ?  
      f.button('.btn roundButton',
               roundNumber < NUM_ROUNDS ? 
               'Finish round and pair for next' : 
               'Finish round and show results',
               on.click(function() {
                 $(this).fadeOut();
                 window.clearInterval(roundTimerId);
                 roundTimerId = undefined;
                 reportResultsAndPairForNextRound(roundReport.matches, players);
               })) : f.div();
  }

  function cleanUpMatch(matches, match) {
    if(!match.players[0] && !match.players[1]) {
      matches.splice(match, 1);
    }

    if(!match.players[0]) {
      match.players[0] = match.players[1];
      match.players[1] = undefined;
    }
  };

  function createMatchTables(matches) {
    var tableCount = 1;

    return f.div('#matchboard', _.map(matches, function(match) {
      return matchTable(matchStream, matches, match, roundTimerRunning, tooltip)})
   )};

  function reportResultsAndPairForNextRound(matches, players) {
    _.map(matches, function(match) {
      var player1 = match.players[0];
      var player2 = match.players[1];
      var player1Games = match.result.games1;
      var player2Games = match.result.games2;

      player1.results = player1.results.concat([{wins:player1Games, 
                                                 loss:player2Games, 
                                                 opponent:player2}]);
      player1.resultStream.push(player1.results)
      if(player2) {
        player2.results = player2.results.concat([{wins:player2Games, 
                                                   loss:player1Games,
                                                   opponent:player1}]);
        player2.resultStream.push(player2.results)
      }
    });
    
    players = sortPlayers(players);
    playerStream.push(players);
    
    if(roundNumber < NUM_ROUNDS) {
      roundNumber++;
      pair.forNextRound(players, matchStream);
    } else {
      matches = [];
      matchStream.push(matches);
      roundReportStream.push({time:ROUND_TIME, 
                              roundFinished:false, 
                              tournamentResult:'Standings after Final Round:'});
    }
  };

  return f.div(
    b.bus(function(bus) {
      return f.div('#newplayer',
                   f.div('.row', f.div('.span4', 
                                       f.input('#player_name', {'type': 'text', 
                                                                'placeholder':'Player name'}, bus.expose,
                                               on.keypress(function(event) {
                                                 if(event.keyCode === 13 || event.keyCode === 10) {
                                                   addPlayer({name:bus.player_name(),
                                                              results:[],
                                                              resultStream:phloem.stream()});
                                                   $('#player_name').select();
                                                 }})))),
                   f.div('.row',
                         f.div('.span1', 
                               f.img('#randomize_button', '.btn', {'src':'img/media-shuffle.png'},
                                     tooltip('Randomize Seating for Draft'),
                                     on.click(function(){
                                       players = _.shuffle(players);
                                       playerStream.push(players);
                                     }))),
                         f.div(f.button('.btn span3', 'Pair for Round One',
                                        on.click(function(){
                                          $('#newplayer').fadeOut();
                                          pair.forFirstRound(players, matchStream);  
                                        })))))}),
    f.div('#backdrop'),
    b.bind(matchStream.read,
           function(matches) {
             return createMatchTables(matches)}),
    b.bind(matchStream.read,
           function(matches) {
             if(matches && matches.length > 0) {
               roundReportStream.push({time:ROUND_TIME, 
                                       roundFinished:false, tournamentResult:undefined});
             }
             return buttonToStartRound(matches);
           }),
    b.bind(roundReportStream.read,
          function(roundReport) {
            return roundReportPanel(roundReport);
          }),
    b.bind(roundReportStream.read,
          function(roundReport) {
            return buttonToFinishRoundAndPairNext(roundReport);
          }),
    b.bind(roundReportStream.read,
          function(roundReport) {
            if(roundReport && roundReport.tournamentResult) {
              return f.div('#tournamentResult', f.span(roundReport.tournamentResult));
            } 
            return f.div();
          }),
    f.div('#players',
          f.div('#players_header', '.row',
                f.span('.span1', ''),
                f.span('.span2', 'Player'), 
                f.span('.span1', 'Points'),
                f.span('.span1', 'OMP',
                       tooltip('Average Match Win Percentage of Played Opponents')),
                f.span('.span1', 'GWP',
                       tooltip('Players Game Win Percentage')),
                f.span('.span1', 'OGP',
                       tooltip('Average Game Win Percentage of Played Opponents')),
                f.span('.span5', 'Match Log')),
          b.bind(playerStream.read,
                 function(currentPlayers) {
                   return f.div(_.map(currentPlayers, function(player) {
                     return f.div('.row', 
                                  on.hover(function() {
                                    $(this).toggleClass('emphasized');
                                    if(!roundTimerRunning()) {
                                      $(this).find('.deleteButton').toggle()};
                                  }),
                                  f.span('.span1',
                                         b.bind(matchStream.read, function(matches) {
                                           if(matches && matches.length > 0)
                                             return f.div('.span1');
                                           return f.div('.span1', 
                                                        f.button('.deleteButton', 'x', {'style':'display:none'},
                                                                 tooltip('Click to Delete Player'),
                                                                 on.click(function() {
                                                                   players = _.without(players, player);
                                                                   playerStream.push(players);
                                                                 })))
                                         })),
                                  f.span('.span2', player.name), 
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchPoints(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(
                                                    opponentsMatchWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(gameWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(
                                                    opponentsMatchWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(
                                                    matchLog(results));
                                                }), {'class':'span5 matchLog'})
                                 )}))})
         ))})
