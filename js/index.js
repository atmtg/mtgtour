define(['foliage', 
        'bud', 
        'phloem', 
        'lodash', 
        'foliage/foliage-event',
        'statistics'], 
       function(f, 
         b, 
         phloem, 
         _, 
         on,
         stats) {

  var NUM_ROUNDS = 3;
  var ROUND_TIME = 3600;

  var matches = [], players = [];
  var matchStream = phloem.stream(), playerStream = phloem.stream();
  var roundReportStream = phloem.stream();
  
  var roundTimerId, roundNumber = 1;
  var playerSelected;

  matchStream.push(matches);
  playerStream.push(players);

  var tooltip = function(text) {
    return function(parent) {
      parent.attr('title', text);
      parent.tooltip();
      return {undo:function(){}}
    }
  }

  function tournamentStarted() {
    return matches.length != 0;
  };

  function roundTimerRunning() {
    return roundTimerId != undefined;
  }

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

  function registerMatchResult(player1, player2, player1Games, player2Games, match) {
    match.result = [{games1:player1Games, games2:player2Games}];
          
    if(player2) {
      if(player1Games == player2Games) 
        match.reportStream.push('Draw');
      if(player1Games > player2Games) 
        match.reportStream.push(player1.name + ' wins <br>' + player1Games + ' - ' + player2Games);
      if(player2Games > player1Games)
        match.reportStream.push(player2.name + ' wins <br>' + player2Games + ' - ' + player1Games);
    } else {
      match.reportStream.push(player1.name + ' receives a bye');
    }
  };

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
      if(!match.players[1])
        registerMatchResult(match.players[0], match.players[1], 2, 0, match);
    })

    var start = new Date().getTime();
    roundTimerId = window.setInterval(function() {
      var elapsed = new Date().getTime() - start;
      var timeLeft = ROUND_TIME - Math.floor(elapsed/1000);
      
      var allMatchesFinished = true;
      _.map(matches, function(match) {
        allMatchesFinished &= (match.result.length > 0);
      })

      roundReportStream.push({time:timeLeft, roundFinished:allMatchesFinished, tournamentResult:undefined})
    }, 1000);
  }

  function roundReportPanel(roundReport) {
    if(typeof roundReport == 'undefined' || roundReport.tournamentResult) return f.div();

    var minutes = Math.floor(roundReport.time/60);
    var seconds = roundReport.time%60 < 10 ? '0' + 
      roundReport.time%60 : roundReport.time%60;
      
    return f.div('#roundPanel', 
                 f.div('#roundTitle', f.span('Round ' + roundNumber)),
                 f.div('#roundTimer', 
                       f.span(roundReport.time <= 0 ? 'TIME' : minutes + ':' + seconds, 
                              {'class': roundReport.time <= 0 ? 'timerEnded' : ''})));
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
                 reportResultsAndPairForNextRound(matches, players);
               })) : f.div();
  }

  var opponentName = function (player2) {
    return player2 ? player2.name : '- Bye -';
  };

  function cleanUpMatch(match) {
    if(!match.players[0] && !match.players[1]) {
      matches.splice(match, 1);
    }

    if(!match.players[0]) {
      match.players[0] = match.players[1];
      match.players[1] = undefined;
    }
  };

  function onClickSelectOrMove(match, playerIndex) {
    return on.click(function() {
      if(!roundTimerRunning()) {
        if(playerSelected) {
          var tempPlayer = match.players[playerIndex];
          match.players[playerIndex] = playerSelected.theMatch.players[playerSelected.thePlayerIndex];
          playerSelected.theMatch.players[playerSelected.thePlayerIndex] = tempPlayer;
          
          cleanUpMatch(match);
          cleanUpMatch(playerSelected.theMatch);
          
          playerSelected = undefined;
          matchStream.push(matches);
        } else {
          playerSelected = {theMatch:match, thePlayerIndex:playerIndex};
        } 
        $(this).toggleClass('selected');
      }
    });
  };

  function createMatchTables(matches) {
    var tableCount = 1;

    return f.div('#matchboard', _.map(matches, function(match) {
      var player1 = match.players[0];
      var player2 = match.players[1];

      return f.div('#table' + tableCount++, {'class':'matchtable span3'},
                   tooltip('Click Table to Register Match Result. \nTo Adjust Pairing: Click a Player Name to Select that Player, and then another Player Name to Switch Chairs.'),
                   on.click(function(){
                     if(player2 && roundTimerRunning()) {
                       $(this).find('.buttonPanel').fadeToggle();
                     }
                   }),
                   f.div(f.div('.matchTableSurface'),
                         f.p('.playerName', player1.name, onClickSelectOrMove(match, 0)),
                         f.p('.player2 playerName', opponentName(player2), 
                             onClickSelectOrMove(match, 1)),
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
                           registerMatchResult(player1, player2, 0, 2, match);})))
                  )})
                )};

  function pairForRoundOne(players) {
    var firstHalf = players.slice(0,Math.ceil(players.length/2));
    var secondHalf = players.slice(Math.ceil(players.length/2), players.length);
    var pairings = _.zip(firstHalf, secondHalf);
    matches = _.map(pairings, function(pairing) {
      return {players:pairing, reportStream:phloem.stream(), result:[]};
    });
    matchStream.push(matches);
  };

  function maxPoints(array, optionalFilter) {
    var max = -1, maxIndex = -1;
    for(var i = 0; i<array.length; i++) {
      if(optionalFilter && !_.contains(optionalFilter, i)) continue;

      if(parseInt(array[i].points, 10) > max) {
        max = array[i].points;
        maxIndex = i;
      }
    }
    return maxIndex;
  };

  function matchesPlayed(player1, player2) {
    return _.reduce(player2.results, function(acc, result) {
      if(result.opponent && result.opponent == player1) 
        return acc + 1;
      return acc;
    }, 0)
  };

  function leastFrequentOpponents(playersAndPoints, player) {
    var numMatchesPlayed = 0;
    var playersFaced = [];
    while(playersFaced.length == 0) {
      for(var i = 0; i<playersAndPoints.length; i++) {
        if(matchesPlayed(playersAndPoints[i].thePlayer, player) == numMatchesPlayed) {
          playersFaced = playersFaced.concat(i);
        }
      }
      numMatchesPlayed++;
    }
    return playersFaced;
  };

  function calculateByes(results) {
    var byes = _.reduce(results, function(acc, result) {
      if(result.opponent) {
        return acc;
      }
      return acc + 1;
    }, 0)

    return byes;
  };

  function playersWithMinByes(playersAndPoints) {
    var minByes = _.min(playersAndPoints, function(playerAndPoint) {
      return playerAndPoint.byes;
    });
    
    var indexes = [];
    for(var i = 0; i<playersAndPoints.length; i++) {
      if(playersAndPoints[i].byes == minByes.byes)
        indexes = indexes.concat(i);
    };
    return indexes;
  };

  function pairForConsecutiveRound(players) {
    var players = _.shuffle(players);

    var playersAndPoints = [];
    _.map(players, function(player) {
      playersAndPoints = 
        playersAndPoints.concat([{thePlayer:player, 
                                  points:matchPoints(player.results),
                                  byes:calculateByes(player.results)}]);
    });
    
    matches = [];
    var byeGiven = playersAndPoints.length%2 == 0;
    while(playersAndPoints.length > 0) {
      var listOfPlayersWithMinByes = playersWithMinByes(playersAndPoints);
      if(!byeGiven && ((playersAndPoints.length%2 == 1 && listOfPlayersWithMinByes.length == 1) ||
                       (playersAndPoints.length%2 == 0 && listOfPlayersWithMinByes.length == 2))) {
        matches = matches.concat([{players:[playersAndPoints[listOfPlayersWithMinByes[0]].thePlayer,
                                            undefined], 
                                   reportStream:phloem.stream(),
                                   result:[]}]);
        playersAndPoints.splice(listOfPlayersWithMinByes[0], 1);
        byeGiven = true;
        continue;
      } 

      var indexOfPlayer1 = maxPoints(playersAndPoints);
      var ply1 = playersAndPoints[indexOfPlayer1].thePlayer;
      playersAndPoints.splice(indexOfPlayer1, 1);

      var leastFrequentOpponentIndexes = leastFrequentOpponents(playersAndPoints, ply1)
      var indexOfPlayer2 = maxPoints(playersAndPoints, leastFrequentOpponentIndexes);
      var ply2 = playersAndPoints[indexOfPlayer2].thePlayer;
      playersAndPoints.splice(indexOfPlayer2, 1);

      matches = matches.concat([{players:[ply1, ply2], 
                                 reportStream:phloem.stream(), 
                                 result:[]}]);
    };

    matchStream.push(matches);
  };

  function reportResultsAndPairForNextRound(matches, players) {
    _.map(matches, function(match) {
      var player1 = match.players[0];
      var player2 = match.players[1];
      var player1Games = match.result[0].games1;
      var player2Games = match.result[0].games2;

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
      pairForConsecutiveRound(players);
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
                               f.img('#randomize_button', '.btn', {'src':'../img/media-shuffle.png'},
                                     tooltip('Randomize Seating for Draft'),
                                     on.click(function(){
                                       players = _.shuffle(players);
                                       playerStream.push(players);
                                     }))),
                         f.div(f.button('.btn span3', 'Pair for Round One',
                                        on.click(function(){
                                          $('#newplayer').fadeOut();
                                          pairForRoundOne(players)  
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
                                    if(!tournamentStarted()) {
                                      $(this).find('.deleteButton').toggle()};
                                  }),
                                  f.div('.span1', f.button('.deleteButton', 'x', {'style':'display:none'},
                                                           tooltip('Click to Delete Player'),
                                                           on.click(function() {
                                                             if(!tournamentStarted()) {
                                                               players = _.without(players, player);
                                                                        playerStream.push(players)};
                                                           }))),
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
