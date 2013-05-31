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

  var NUM_ROUNDS = 3;
  var ROUND_TIME = 3600;

  var matches = [];
  var players = [];
  var matchStream = phloem.stream();
  var playerStream = phloem.stream();
  var roundReportStream = phloem.stream();
  var roundTimerId;
  var roundNumber = 1;

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

    return winsAndTotal.total == 0 ? (0).toFixed(2) : 
      ((winsAndTotal.wins / winsAndTotal.total) * 100).toFixed(2);
  };
         
  function opponentsMatchWinPercentage(results) {
    var numOpponents = 0;
    var accumulatedMatchWinPercentage = 0;
    _.each(results, function(result) {
      if(result.opponent) {
        accumulatedMatchWinPercentage = matchWinPercentage(result.opponent.results);
        numOpponents++;
      };
    });

    return numOpponents == 0 ? (0).toFixed(2) : 
      (accumulatedMatchWinPercentage / numOpponents).toFixed(2);
  };

  function opponentsGameWinPercentage(results) {
    var numOpponents = 0;
    var accumulatedGameWinPercentage = 0;
    _.each(results, function(result) {
      if(result.opponent) {
        accumulatedGameWinPercentage = 
          Math.max(gameWinPercentage(result.opponent.results), 33.00);
        numOpponents++;
      };
    });

    return numOpponents == 0 ? (0).toFixed(2) :
      (accumulatedGameWinPercentage / numOpponents).toFixed(2);
  };

  function matchLog(results) {
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
          return opponentsGameWinPercentage(b.results) -
            opponentsGameWinPercentage(a.results);
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
      if(!match.player2)
        registerMatchResult(match.player1, match.player2, 2, 0, match);
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
      f.button('Start round', 
               {'class':'btn roundButton'},
               on.click(function(){
                 handleRound(matches);
                 $(this).fadeOut();
               }))) : f.div();
  };

  function buttonToFinishRoundAndPairNext(roundReport) {
    return roundReport && roundReport.roundFinished ?  
      f.button(roundNumber < NUM_ROUNDS ? 
               'Finish round and pair for next' : 
               'Finish round and show results',
               {'class':'btn roundButton'},
               on.click(function() {
                 $(this).fadeOut();
                 window.clearInterval(roundTimerId);
                 reportResultsAndPairForNextRound(matches, players);
               })) : f.div();
  }

  function opponentName(player2) {
    return player2 ? player2.name : '- Bye -';
  };

  function createMatchTables(matches) {
    var tableCount = 1;

    return f.div('#matchboard', _.map(matches, function(match) {
      var player1 = match.player1;
      var player2 = match.player2;

      return f.div('#table' + tableCount++, {'class':'matchtable span3', 
                                             'title':'Click Table to Register Match Result'},
                   on.hover(function() {$(this).tooltip();}),
                   on.click(function(){
                     if(player2) {
                       $(this).find('.buttonPanel').fadeToggle();
                     }
                   }),
                   f.div(f.div({'class':'matchTableSurface'}),
                         f.p(player1.name, {'class':'playerName'}),
                         f.p(opponentName(player2), {'class':'player2 playerName'}),
                         b.bind(match.reportStream.read, function(report) {
                           return f.div({'class':'matchResult'}, 
                                        f.span(report));
                         })),
                   f.div({'class':'buttonPanel', 'style':'display:none'},
                         f.button('2-0', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 2, 0, match);})),
                         f.button('2-1', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 2, 1, match);})),
                         f.button('1-1', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 1, 1, match);})),
                         f.button('1-2', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 1, 2, match);})),
                         f.button('0-2', {'class':'btn'}, on.click(function(){
                           registerMatchResult(player1, player2, 0, 2, match);})))
                  )})
                )};

  function pairForRoundOne(players) {
    var firstHalf = players.slice(0,Math.ceil(players.length/2));
    var secondHalf = players.slice(Math.ceil(players.length/2), players.length);
    var pairings = _.zip(firstHalf, secondHalf);
    matches = _.map(pairings, function(pairing) {
      return {player1:pairing[0], player2:pairing[1], reportStream:phloem.stream(), result:[]};
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
    while(playersAndPoints.length > 0) {
      var listOfPlayersWithMinByes = playersWithMinByes(playersAndPoints);
      if((playersAndPoints%2 == 1 && listOfPlayersWithMinByes.length == 1) ||
         (playersAndPoints%2 == 0 && listOfPlayersWithMinyes == 2)) {
        matches = matches.concat([{player1:playersAndPoints[listOfPlayersWithMinByes[0]].thePlayer, 
                                   player2:undefined, 
                                   reportStream:phloem.stream(), 
                                   result:[]}]);
        playersAndPoints.splice(listOfPlayersWithMinByes[0], 1);
        continue;
      } 

      var indexOfPlayer1 = maxPoints(playersAndPoints);
      var ply1 = playersAndPoints[indexOfPlayer1].thePlayer;
      playersAndPoints.splice(indexOfPlayer1, 1);

      var leastFrequentOpponentIndexes = leastFrequentOpponents(playersAndPoints, ply1)
      var indexOfPlayer2 = maxPoints(playersAndPoints, leastFrequentOpponentIndexes);
      var ply2 = playersAndPoints[indexOfPlayer2].thePlayer;
      playersAndPoints.splice(indexOfPlayer2, 1);

      matches = matches.concat([{player1:ply1, 
                                 player2:ply2, 
                                 reportStream:phloem.stream(), 
                                 result:[]}]);
    };

    matchStream.push(matches);
  };

  function reportResultsAndPairForNextRound(matches, players) {
    _.map(matches, function(match) {
      var player1Games = match.result[0].games1;
      var player2Games = match.result[0].games2;

      match.player1.results = 
        match.player1.results.concat([{wins:player1Games, 
                                       loss:player2Games, 
                                       opponent:match.player2}]);
      match.player1.resultStream.push(match.player1.results)
      if(match.player2) {
        match.player2.results = 
          match.player2.results.concat([{wins:player2Games, 
                                         loss:player1Games,
                                         opponent:match.player1}]);
        match.player2.resultStream.push(match.player2.results)
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
                   f.div({'class':'row'},
                         f.div({'class':'span4'}, 
                               f.input('#player_name', {'type': 'text', 
                                                        'placeholder':'Player name'}, bus.expose,
                                       on.keypress(function(event) {
                                         if(event.keyCode === 13 || event.keyCode === 10) {
                                           addPlayer({name:bus.player_name(),
                                                      results:[],
                                                      resultStream:phloem.stream()});
                                           $('#player_name').select();
                                         }})))),
                   f.div({'class':'row'},
                         f.div({'class':'span1'}, 
                               f.img('#randomize_button', {'src':'../img/media-shuffle.png', 'class':'btn', 
                                          'title':'Randomize Seating for Draft'},
                                     on.hover(function() {
                                       $(this).tooltip();
                                     }),
                                     on.click(function(){
                                       players = _.shuffle(players);
                                       playerStream.push(players);
                                     }))),
                         f.div(f.button('Pair for Round One', {'class':'btn span3'},
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
          f.div('#players_header', {'class':'row'},
                f.span('', {'class':'span1'}),
                f.span('Player', {'class':'span2'}), 
                f.span('Points', {'class':'span1'}),
                f.span('GWP', {'title':'Players Game Win Percentage','class':'span1'},
                      on.hover(function() {$(this).tooltip();})),
                f.span('OMP', {'title':'Average Match Win Percentage of Played Opponents','class':'span1'},
                      on.hover(function() {$(this).tooltip();})),
                f.span('OGP', {'title':'Average Game Win Percentage of Played Opponents','class':'span1'},
                      on.hover(function() {$(this).tooltip();})),
                f.span('Match Log', {'class':'span5'})),
          b.bind(playerStream.read,
                 function(currentPlayers) {
                   return f.div(_.map(currentPlayers, function(player) {
                     return f.div({'class':'row'}, 
                                  on.hover(function() {
                                    $(this).toggleClass('emphasized');
                                    if(matches.length == 0) {
                                      $(this).find('.deleteButton').toggle()};
                                  }),
                                  f.div({'class':'span1'}, f.button('x', {'class':'deleteButton',
                                                                          'style':'display:none',
                                                                          'title':'Click to Delete Player'},
                                                                    on.hover(function() {
                                                                      $(this).tooltip();
                                                                    }),
                                                                    on.click(function() {
                                                                      if(matches.length == 0) {
                                                                        players = _.without(players, player);
                                                                        playerStream.push(players)};
                                                                    }))),
                                  f.span(player.name, {'class':'span2'}), 
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(matchPoints(results));
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
                                                    opponentsMatchWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(
                                                    matchLog(results));
                                                }), {'class':'span5 matchLog'})
                                 )}))})
         ))})
