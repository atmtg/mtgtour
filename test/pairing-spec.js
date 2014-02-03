define(
  ['pairing', 'phloem', 'when'],
  function(pairing, phloem, when) {

    var winAgainst = function(name) {
      return {wins:2, loss:0, opponent:name};};

    var bye = function() {
      return {wins:2, loss:0, opponent:undefined};};

    var lossAgainst = function(name) {
      return {wins:0, loss:2, opponent:name};};

    var assert = buster.assert;
    var refute = buster.refute;
    buster.testCase("Pairing module -", {
      '//can handle two players' : function() {
        var twoPlayers = ['Kalle', 'Pelle'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(twoPlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 1);
          assert.equals(result.value[0].players, ['Kalle', 'Pelle']);
        })
      },
      '//Players are paired across for first round' : function() {
        var eightPlayers = ['Kalle', 'Pelle', 'Olle', 'Nisse', 'Hasse', 'Lasse', 'Bosse', 'Kurt'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(eightPlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 4);
          assert.equals(result.value[0].players, ['Kalle', 'Hasse']);
          assert.equals(result.value[1].players, ['Pelle', 'Lasse']);
          assert.equals(result.value[2].players, ['Olle', 'Bosse']);
          assert.equals(result.value[3].players, ['Nisse', 'Kurt']);
        })
      },
      '// Uneven players result in undefined opponent in final match' : function() {
        var fivePlayers = ['Kalle', 'Pelle', 'Olle', 'Nisse', 'Hasse'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(fivePlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 3);
          assert.equals(result.value[0].players, ['Kalle', 'Nisse']);
          assert.equals(result.value[1].players, ['Pelle', 'Hasse']);
          assert.equals(result.value[2].players, ['Olle', undefined]);
        })
      },
      'Player with fewest number of points will sit out next round' : function() {
        var kalle = {name:'Kalle', pod:1, results:[winAgainst('Pelle')], dropped:false};
        var pelle = {name:'Pelle', pod:1, results:[lossAgainst('Kalle')], dropped:false};
        var olle = {name:'Olle', pod:1, results:[bye()], dropped:false};
        var threePlayers = [kalle, pelle, olle];
        var resultStream = phloem.stream();

        pairing.forNextRound(threePlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 2);
          assert.equals(result.value[1].players, [pelle, undefined]);
        })
      },
      'Player with highest number of points will sit out if that player is last to sit out' : function() {
        var kalle = {name:'Kalle', pod:1, results:[winAgainst('Pelle'), winAgainst('Olle')], dropped:false};
        var pelle = {name:'Pelle', pod:1, results:[lossAgainst('Kalle'), bye()], dropped:false};
        var olle = {name:'Olle', pod:1, results:[bye(), lossAgainst('Kalle')], dropped:false};
        var threePlayers = [kalle, pelle, olle];
        var resultStream = phloem.stream();

        pairing.forNextRound(threePlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 2);
          assert.equals(result.value[0].players, [kalle, undefined]);
        })
      },
      'dropped player is ignored when pairing' : function() {
        var kalle = {name:'Kalle', pod:1, results:[winAgainst('Pelle'), winAgainst('Olle')], dropped:false};
        var pelle = {name:'Pelle', pod:1, results:[lossAgainst('Kalle'), bye()], dropped:true};
        var olle = {name:'Olle', pod:1, results:[bye(), lossAgainst('Kalle')], dropped:false};
        var threePlayers = [kalle, pelle, olle];
        var resultStream = phloem.stream();

        pairing.forNextRound(threePlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 1);
          assert.equals(result.value[0].players, [kalle, olle]);
        })
      }
    })});
