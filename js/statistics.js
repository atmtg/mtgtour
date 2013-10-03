define(['lodash'], function(_) {
  
  var matchPoints = function(results) {
    return _.reduce(results, function(acc, val) {
      if(val.wins > val.loss) return acc + 3;
      if(val.wins == val.loss) return acc + 1;
      return acc}, 0)
  };
  
  var matchWinPercentage = function (results) {
    var playersMatchPoints = matchPoints(results);
    
    return results ? (Math.max((playersMatchPoints/(results.length * 3)), 0.33) * 100).toFixed(2) : 
      (0).toFixed(2);
  };
  
  var gameWinPercentage = function (results) {
    var winsAndTotal = _.reduce(results, function(acc, val) {
      acc.points += (val.wins * 3);
      acc.total += val.wins + val.loss;
      return acc}, {points:0, total:0})

    return winsAndTotal.total == 0 ? (0).toFixed(2) : 
      ((winsAndTotal.points / (winsAndTotal.total * 3)) * 100).toFixed(2);
  };

  var opponentsMatchWinPercentage = function (results) {
    var numOpponents = 0;
    var accumulatedMatchWinPercentage = 0.00;
    _.each(results, function(result) {
      if(result.opponent && result.opponent.results) {
        accumulatedMatchWinPercentage += parseFloat(matchWinPercentage(result.opponent.results));
        numOpponents++;
      };
    });
    
    return numOpponents == 0 ? (0).toFixed(2) : 
      (accumulatedMatchWinPercentage / numOpponents).toFixed(2);
  };

  var opponentsGameWinPercentage = function (results) {
    var numOpponents = 0;
    var accumulatedGameWinPercentage = 0;
    _.each(results, function(result) {
      if(result.opponent) {
        accumulatedGameWinPercentage += 
          Math.max(gameWinPercentage(result.opponent.results), 33.00);
        numOpponents++;
      };
    });

    return numOpponents == 0 ? (0).toFixed(2) :
      (accumulatedGameWinPercentage / numOpponents).toFixed(2);
  };


  return {matchPoints:matchPoints,
          matchWinPercentage:matchWinPercentage,
          gameWinPercentage:gameWinPercentage,
          opponentsMatchWinPercentage:opponentsMatchWinPercentage,
          opponentsGameWinPercentage:opponentsGameWinPercentage};

});
