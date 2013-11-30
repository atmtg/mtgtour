define(['foliage', 
        'bud', 
        'phloem', 
        'lodash', 
        'foliage/foliage-event',
        'statistics',
        'pairing',
        'matchtable',
        'timer',
        'store',
        'when'], 
       function(f, 
                b, 
                phloem, 
                _, 
                on,
                stats,
                pair,
                matchTable,
                timer,
                store,
                when) {

  var NUM_ROUNDS = 3;

  var activeTournament = store.load("activeTournament");
  var currentTournament = store.subStore(activeTournament || 'tournament');

  var pairings = currentTournament.load("pairings") || [];
  var playerStore = currentTournament.subStore("players");
  var playerStoreStream = phloem.stream();
  var loadedPlayers = {};
  var loadPlayer = function(playerName) {
      var getOpponent = function() {
          return this.opponentName && loadPlayer(this.opponentName);
      };
      var doLoad = function() {
          if (playerName === null) {
              return undefined;
          }
          var player = playerStore.load(playerName);
          player.results = _.map(player.results, function(result) {
              result.opponent = getOpponent; 
              return result;
          });
          player.resultStream = phloem.stream();
          player.resultStream.push(player.results);
          
          loadedPlayers[playerName] = player;
          return player;
      }
      return loadedPlayers[playerName] || doLoad();
  };

  var players = _.map(playerStore.ls(), function(playerName) {
      return loadPlayer(playerName);
  });

  phloem.each(playerStoreStream.read.next(), function(player) {
      var resultsToStore = _.map(player.results, function(result){
        return {wins:result.wins, loss:result.loss, draw:result.draw, opponentName:result.opponentName}; 
      });

      var playerToStore = {name: player.name, results:resultsToStore, dropped:player.dropped};
      playerStore.save(player.name, playerToStore);
  });

  var matchStream = phloem.stream(), playerStream = phloem.stream();
  var roundReportStream = phloem.stream();
  var swapPlayerStream = phloem.stream();

  var roundNumber = players.length > 0 ? _.max(players, function(player) {
    return player.results.length}).results.length + 1: 1;


  when(matchStream.read.next()).then(function(elem) {
      console.log("next match element", elem);
      phloem.each(elem.next(), function(matches) {
          currentTournament.save('pairings', 
                                 _.map(matches, function(match) {
                                     return _.map(match.players, function(player) {
                                         return player && player.name;
                                     });
                                 }));
      });
  });

  matchStream.push(_.map(pairings, function(pairing) {
      return pair.createMatch(_.map(pairing, loadPlayer));
  }));


           

  playerStream.push(players);

  var tooltip = function(text) {
    return function(parent) {
      parent.attr('title', text);
      parent.tooltip();
      return {undo:function(){}}
    }
  }

  var roundTimerRunning = function() {
    return timer.running();
  };

  function addPlayer(player) {
    playerStoreStream.push(player);
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
      result.opponent();
      if(result.opponent()) {
        matchLogString += result.opponent().name + ' (' + 
          result.wins + '-' + result.loss + (result.draws ? '-'+result.draws : '') + '), '
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
    
    phloem.each(timer.read(), function(progress){
      var allMatchesFinished = true && timer.running();
      _.map(matches, function(match) {
        allMatchesFinished &= (match.result !== undefined);
      })

      roundReportStream.push({roundFinished:allMatchesFinished, 
                              tournamentResult:undefined,
                              matches:matches})
    });
    timer.start();
  }

  function timerDisplay() {
      
      return b.bind(timer.read(), function(progress) {
          var minutes = progress.minutesRemaining;
          var seconds = progress.secondsRemaining;

          return f.div('#roundTimer', 
                       f.span(progress.remaining <= 0 ? 'TIME' : minutes + ':' + seconds, 
                              {'class': progress.remaining <= 0 ? 'timerEnded' : ''}),
                       f.div('.btn-group-vertical pull-right', {'style':'margin-left:0.2em; margin-top:-0.1em'},
                             
                             f.button('.btn btn-small', f.i('.icon-plus'), on.click(function() {
                               timer.extendBy(60);
                             })),
                             f.button('.btn btn-small', f.i('.icon-minus'), on.click(function() {
                               timer.decreaseBy(60);
                             }))),
                       f.div('.progress progress-striped',
                             {'class':progress.remaining < 180 ? 'progress-danger' : 
                              progress.remaining < 600 ? 'progress-warning' : 'progress-success'},
                             f.div('.bar', {'style':'width:' + (progress.remaining/progress.total)*100 + '%' })))
          });
      
  }

  function roundReportPanel(roundReport) {
    if(!roundReport || roundReport.tournamentResult) return f.div();
    f.i = f.element('i');
    return f.div('#roundPanel', 
                 f.div('#roundTitle', f.span('Round ' + roundNumber)),
                 timerDisplay());
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
                 timer.stop();
                 timer.reset();
                 reportResultsAndPairForNextRound(roundReport.matches, players);
               })) : f.div();
  };

  function buttonToStartNewTournament() {
    return f.button('.btn roundButton',
            'Start new tournament',
            on.click(function() {
              $(this).fadeOut();
              var newTournamentKey = "Tournament-" + (new Date()).toString();
              store.save("activeTournament", newTournamentKey);
              currentTournament = store.subStore(newTournamentKey);
              document.location.reload();
            }));
  };

  function deleteButton(player) {
    return f.div(f.button('.deleteButton .btn', 
                          'delete', {'style':'display:none'},
                          on.click(function() {
                            playerStore.rm(player.name);
                            players = _.without(players, player);
                            playerStream.push(players);
                          })))
  }

  function dropButton(player) {
    return f.div(f.button('.deleteButton .btn', 
                          'drop', {'style':'display:none'},
                          on.click(function() {
                            player.dropped = !player.dropped;
                            playerStoreStream.push(player);
                            playerStream.push(players);
                            if(!roundTimerRunning()) {
                              pair.forNextRound(players, matchStream);
                            }
                          })))
  }
         
  function createMatchTables(matches) {
    var tableCount = 1;

    return f.div('#matchboard', _.map(matches, function(match) {
      return matchTable(matchStream, matches, match, roundTimerRunning, tooltip, swapPlayerStream)})
   )};

  function reportResultsAndPairForNextRound(matches, players) {
    _.map(matches, function(match) {
      var player1 = match.players[0];
      var player2 = match.players[1];
      var player1Games = match.result.games1;
      var player2Games = match.result.games2;
      var drawnGames = match.result.draws;

      player1.results = player1.results.concat([{wins:player1Games, 
                                                 loss:player2Games, 
                                                 draws:drawnGames ? drawnGames : 0,
                                                 opponentName:player2 && player2.name,
                                                 opponent:function(){return player2}}]);
      player1.resultStream.push(player1.results);
      playerStoreStream.push(player1);
      if(player2) {
        player2.results = player2.results.concat([{wins:player2Games, 
                                                   loss:player1Games,
                                                   draws: drawnGames ? drawnGames : 0,
                                                   opponentName:player1.name,
                                                   opponent:function(){return player1}}]);
        player2.resultStream.push(player2.results);
        playerStoreStream.push(player2);
      }
    });
    
    players = sortPlayers(players);
    playerStream.push(players);
    
    if(roundNumber < NUM_ROUNDS) {
      roundNumber++;
      pair.forNextRound(players, matchStream);
    } else {
      matches = undefined;
      matchStream.push(matches);
      
      roundReportStream.push({roundFinished:false, 
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
                                                              resultStream:phloem.stream(),
                                                              dropped:false});
                                                   $('#player_name').select();
                                                 }})))),
                   f.div('.row',
                         f.div('.span1', 
                               f.button('#randomize_button', '.btn', f.i('.icon-random'),
                                     tooltip('Randomize Seating for Draft'),
                                     on.click(function(){
                                       players = _.shuffle(players);
                                       playerStream.push(players);
                                     }))),
                         f.div(f.button('.btn span3', 'Pair for Round One',
                                        on.click(function(){
                                            pair.forFirstRound(players, matchStream);  
                                        })))))}),
    f.div('#backdrop'),
    b.bind(matchStream.read,
           function(matches) {
             return createMatchTables(matches)}),
    b.bind(matchStream.read,
           function(matches) {
             if(matches && matches.length > 0) {
                 $('#newplayer').hide();
                 roundReportStream.push({roundFinished:false, 
                                         tournamentResult:undefined});
                 timer.update();
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
              return f.div('#tournamentResult', f.span(roundReport.tournamentResult),
                          buttonToStartNewTournament());
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
                                  player.dropped ? '.dropped' : undefined,
                                  on.hover(function() {
                                    $(this).toggleClass('emphasized');
                                    if(!player.dropped)
                                      $(this).find('.deleteButton').toggle();
                                  }),
                                  f.span('.span1',
                                         b.bind(matchStream.read.next(), function(matches) {
                                           return matches.length > 0 ? dropButton(player) : deleteButton(player);
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
                                                    opponentsGameWinPercentage(results));
                                                }), {'class':'span1'}),
                                  f.span(b.bind(player.resultStream.read,
                                                function(results){
                                                  return f.span(
                                                    matchLog(results));
                                                }), {'class':'span5 matchLog'})
                                 )}))})
         ))})
