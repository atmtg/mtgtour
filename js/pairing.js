define(['lodash', 'phloem', 'statistics'], function(_, phloem, stats) {

  function forFirstRound(players, matchStream) {
    var firstHalf = players.slice(0,Math.ceil(players.length/2));
    var secondHalf = players.slice(Math.ceil(players.length/2), players.length);
    var pairings = _.zip(firstHalf, secondHalf);
    var matches = _.map(pairings, function(pairing) {
      return createMatch(pairing);
    });
    matchStream.push(matches);
  };

  function createMatch(pairing) {
      var match = {players:pairing, reportStream:phloem.stream()};
      match.registerResult =  function (player1Games, player2Games) {
          match.result = {games1:player1Games, games2:player2Games};
          match.reportStream.push(match.result);
      };
      match.registerDraw =  function (drawnGames) {
          match.result.draws = drawnGames;
          match.reportStream.push(match.result);
      };
      return match;
  };

  var matchesPlayed = function(player1, player2) {
    return _.reduce(player2.results, function(acc, result) {
      if(result.opponent && result.opponent == player1) 
        return acc + 1;
      return acc;
    }, 0)
  };

  var leastFrequentOpponents = function(playersAndPoints, player) {
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

  var byesReceived = function (results) {
    var byes = _.reduce(results, function(acc, result) {
      if(result.opponent) {
        return acc;
      }
      return acc + 1;
    }, 0)

    return byes;
  };

  var playersWithMinimumNumberOfByes = function(playersAndPoints) {
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

  var maxPoints = function(array, optionalFilter) {
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

  function forNextRound(players, matchStream) {
    var players = _.shuffle(players);

    var playersAndPoints = [];
    _.map(players, function(player) {
      playersAndPoints = 
        playersAndPoints.concat([{thePlayer:player, 
                                  points:stats.matchPoints(player.results),
                                  byes:byesReceived(player.results)}]);
    });
    
    var matches = [];
    var byeGivenThisRound = playersAndPoints.length%2 == 0;
    while(playersAndPoints.length > 0) {
      var listOfPlayersWithMinByes = playersWithMinimumNumberOfByes(playersAndPoints);
      if(!byeGivenThisRound && ((playersAndPoints.length%2 == 1 && listOfPlayersWithMinByes.length == 1) ||
                       (playersAndPoints.length%2 == 0 && listOfPlayersWithMinByes.length == 2))) {
        matches = matches.concat([
            createMatch([playersAndPoints[listOfPlayersWithMinByes[0]].thePlayer,
                                            undefined])
        ]);
        playersAndPoints.splice(listOfPlayersWithMinByes[0], 1);
        byeGivenThisRound = true;
        continue;
      } 

      var indexOfPlayer1 = maxPoints(playersAndPoints);
      var ply1 = playersAndPoints[indexOfPlayer1].thePlayer;
      playersAndPoints.splice(indexOfPlayer1, 1);

      var leastFrequentOpponentIndexes = leastFrequentOpponents(playersAndPoints, ply1)
      var indexOfPlayer2 = maxPoints(playersAndPoints, leastFrequentOpponentIndexes);
      var ply2 = playersAndPoints[indexOfPlayer2].thePlayer;
      playersAndPoints.splice(indexOfPlayer2, 1);
      matches = matches.concat([createMatch([ply1, ply2])]);
    };

    matchStream.push(matches);
  };

  return {forFirstRound:forFirstRound,
          forNextRound:forNextRound};
})
