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
  var VERSION = 'v1.7.0 (2015-06-23)';
  var DEFAULT_NUM_ROUNDS = 3;
  var numRoundsStream = phloem.stream();
  numRoundsStream.push(DEFAULT_NUM_ROUNDS);
  var numRounds = DEFAULT_NUM_ROUNDS;	   
	   
  var timeAudio = new Audio('../media/time.mp3');
  var threeMinuteWarning = new Audio('../media/3minutes.mp3');
  var tenMinuteWarning = new Audio('../media/10minutes.mp3');

  var seatingPositions = [[],[2],[2,6],[2,3,6],[2,3,6,7],[1,2,3,6,7],[1,2,3,5,6,7],[1,2,3,4,5,6,7],[1,2,3,4,5,6,7,8]];
	   
  var matchPoints = stats.matchPoints;
  var matchWinPercentage = stats.matchWinPercentage; 
  var gameWinPercentage = stats.gameWinPercentage;
  var opponentsMatchWinPercentage = stats.opponentsMatchWinPercentage;
  var opponentsGameWinPercentage = stats.opponentsGameWinPercentage;

  var activeTournament = store.load("activeTournament");
  var currentTournament = store.subStore(activeTournament || 'tournament');

  var matchStream = phloem.stream(), playerStream = phloem.stream();

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

  var players = sortPlayers(_.map(playerStore.ls(), function(playerName) {
    return loadPlayer(playerName);
  }));
  playerStream.push(players);

  phloem.each(playerStoreStream.read.next(), function(player) {
      var resultsToStore = _.map(player.results, function(result){
        return {wins:result.wins, loss:result.loss, draw:result.draw, opponentName:result.opponentName}; 
      });

      var playerToStore = {name: player.name, results:resultsToStore, dropped:player.dropped, pod:player.pod};
      playerStore.save(player.name, playerToStore);
  });

  var roundReportStream = phloem.stream();
  var swapPlayerStream = phloem.stream();

  var roundNumber = players.length > 0 ? _.max(players, function(player) {
    return player.results.length}).results.length + 1: 1;


  when(matchStream.read.next()).then(function(elem) {
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

  function reportRoundStatus(matches){
      var allMatchesFinished = true;
      _.map(matches, function(match) {
        allMatchesFinished &= (match.result !== undefined);
      });
    roundReportStream.push({roundFinished:allMatchesFinished, 
                            tournamentResult:undefined,
                            matches:matches});
  }

  function handleRound(matches) {
    _.each(matches, function(match) {
      if(!match.players[1]) {
        match.registerResult( 2, 0);
      }
    })

    timer.start();
    roundReportStream.push({roundFinished:false, 
                            tournamentResult:undefined,
                            matches:matches})
  }

  function timerDisplay() {
      return b.bind(timer.read().read.next(), function(progress) {
          var minutes = progress.minutesRemaining;
          var seconds = progress.secondsRemaining;

	  if(minutes == 10 && seconds == 0) tenMinuteWarning.play();
	  if(minutes == 3 && seconds == 0) threeMinuteWarning.play();
	  if(minutes == 0 && seconds == 0) timeAudio.play();
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

  function roundDisplay() {
      return b.bind(numRoundsStream.read, function(rounds) {
	  return f.div('#roundTitle',
		       f.span('Round ' + roundNumber + ' / ' + rounds),
		       f.div('.btn-group-vertical', {'style':'margin-left:0.2em; margin-top:-0.1em'},
			     f.button('.btn btn-small', f.i('.icon-plus'), on.click(function() {
				 numRoundsStream.push(rounds + 1);
			     })),
			     f.button('.btn btn-small', f.i('.icon-minus'), on.click(function() {
				 if(rounds > roundNumber) {
				     numRoundsStream.push(rounds - 1);
				 }
			     })))
			    );});
  }

  function roundReportPanel(roundReport) {
      if(!roundReport || roundReport.tournamentResult) return f.div();
      f.i = f.element('i');
      return f.div('#roundPanel', 
                   roundDisplay(),
                   timerDisplay());
  }

  function buttonToStartRound(matches) {
    return _.size(matches) > 0 ? f.div('#startRoundButton',
      f.button('.btn roundButton',
               'Start round',
               on.click(function(){
		 handleRound(matches);
                 $(this).fadeOut();
               }))) : f.div('#startRoundButton');
  };

  function buttonToFinishRoundAndPairNext(roundReport) {
      return roundReport && roundReport.roundFinished ?
	  f.button('.btn roundButton',
		   roundNumber < numRounds ? 
		   'Finish round and pair for next' : 
		   'Finish round and show results',
		   on.click(function() {
		       $(this).fadeOut();
		       timer.stop();
		       timer.reset();
		       reportResultsAndPairForNextRound(roundReport.matches, players);
		   })) : f.div();
  };

  function resetTournament() {
      $(this).fadeOut();
      var newTournamentKey = "Tournament-" + (new Date()).toString();
      store.save("activeTournament", newTournamentKey);
      currentTournament = store.subStore(newTournamentKey);
      document.location.reload();
      numRoundsStream.push(DEFAULT_NUM_ROUNDS);
  }; 
	   
  function buttonToStartNewTournament() {
      return f.button('.btn roundButton',
		      'Start new tournament',
		      on.click(resetTournament));
  };

  function draftTable(players, extraStyle) {
      if(players.length == 0) return f.div();
      var playerIndex = 0;
      
      return f.div('.draftpod', extraStyle, _.map(players, function(player) {
	  return f.div('.seat seat' + seatingPositions[players.length][playerIndex++], player.name);
      }))
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
      return matchTable(matchStream, matches, match, roundTimerRunning, tooltip, swapPlayerStream, reportRoundStatus)}));
  };

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
    
    if(roundNumber < numRounds) {
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
                   f.div('.row', f.div('.span5', 
                                       f.input('#player_name', {'type': 'text', 
                                                                'placeholder':'Player name'}, bus.expose,
                                               on.keypress(function(event) {
                                                 if(event.keyCode === 13 || event.keyCode === 10) {
                                                   addPlayer({name:bus.player_name(),
                                                              results:[],
                                                              resultStream:phloem.stream(),
                                                              dropped:false,
                                                              pod:1});
                                                   $('#player_name').select();
                                                 }})))),
                   f.div('.row',
                         f.button('.btn', {'style':'margin-right:10px;height:2.2em'}, f.i('.icon-random'),
                                  tooltip('Randomize Seating for Draft'),
                                  on.click(function(){
                                    players = _.shuffle(players);
                                    playerStream.push(players);
                                  })),
                         f.button('.btn', {'style':'margin-right:10px'},
                                  'Split',
                                  tooltip('Toggle Split into Two Draft Pods'),
                                  on.click(function() {
                                    if($(this).hasClass('active')) {
                                      _.each(players, function(player) {player.pod = 1})
                                        } else {
                                          var splittingIndex = (players.length / 2) % 2 == 1 ? 
                                            Math.ceil(players.length/2) + 1 :
                                            Math.ceil(players.length/2);
                                          var firstHalf = players.slice(0, splittingIndex);
                                          var secondHalf = players.slice(splittingIndex, players.length);
                                          _.each(firstHalf, function(player) {
                                            player.pod = 1;
                                            playerStoreStream.push(player);
                                          });
                                          _.each(secondHalf, function(player) {
                                            player.pod = 2;
                                            playerStoreStream.push(player);
                                          });}
                                    playerStream.push(players);
                                    $(this).toggleClass('active');
                                  })),
                         f.button('.btn', 'Pair for Round One',
                                  on.click(function(){
				    $('#drafttables').fadeOut();
				    $('#players').fadeIn();
                                    pair.forFirstRound(players, matchStream);  
                                  }))))}),
    f.div('#backdrop'),
    f.div('#version-text', VERSION),
    f.div('#reset', f.button('.btn', 'Reset Tournament', on.click(resetTournament))),  
    b.bind(matchStream.read,
           function(matches) {
             var topValue = _.size(matches) > 0 ? 33 * (Math.ceil(_.size(matches) / 4) - 1) : 0;
             $('#players').css({'top': (50 + topValue) + '%'});
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
    b.bind(numRoundsStream.read,
	  function(newNumRounds) {
	      numRounds = newNumRounds;
	      return f.div();
	  }),
    b.bind(roundReportStream.read,
          function(roundReport) {
            if(roundReport && roundReport.tournamentResult) {
              return f.div('#tournamentResult', f.span(roundReport.tournamentResult),
                          buttonToStartNewTournament());
            } 
            return f.div();
          }),
      f.div('#drafttables',
	    b.bind(playerStream.read,
		   function(currentPlayers) {
		       var multiPod = _.find(currentPlayers, {'pod' : 2});
		     return f.div({'style':'display:' + (roundNumber == 1 ? 'true' : 'none')},
				  draftTable(_.filter(currentPlayers, {'pod' : 1}), multiPod ? '.leftpod' : ''),
				  draftTable(_.filter(currentPlayers, {'pod' : 2}), multiPod ? '.rightpod' : ''));
		   })),
      b.bind(playerStream.read, function(currentPlayers) {
	  if(!currentPlayers || currentPlayers == 0) return f.div();
	  return f.div('#players', {'style':'display:' + (roundNumber > 1 || currentPlayers.length > 8 ? 'true' : 'none')},
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
		       f.div(_.map(currentPlayers, function(player) {
			   return f.div('.row',
					player.dropped ? '.dropped' : undefined,
					player.pod ? player.pod == 1 ? '.pod1' : '.pod2' : undefined,
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
                                       )})))})
  )})
