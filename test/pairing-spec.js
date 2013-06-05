define(
  ['pairing', 'phloem'],
  function(pairing, phloem) {
    var assert = buster.assert;
    var refute = buster.refute;
    buster.testCase("Pairing module", {
      'Pairing module can handle two players' : function() {
        var twoPlayers = ['Kalle', 'Pelle'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(twoPlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 1);
          assert.equals(result.value[0].players, ['Kalle', 'Pelle']);
        })
      },
      'Players are paired across for first round' : function() {
        var twoPlayers = ['Kalle', 'Pelle', 'Olle', 'Nisse', 'Hasse', 'Lasse', 'Bosse', 'Kurt'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(twoPlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 4);
          assert.equals(result.value[0].players, ['Kalle', 'Hasse']);
          assert.equals(result.value[1].players, ['Pelle', 'Lasse']);
          assert.equals(result.value[2].players, ['Olle', 'Bosse']);
          assert.equals(result.value[3].players, ['Nisse', 'Kurt']);
        })
      },
      'Uneven players result in undefined opponent in final match' : function() {
        var twoPlayers = ['Kalle', 'Pelle', 'Olle', 'Nisse', 'Hasse'];
        var resultStream = phloem.stream();

        pairing.forFirstRound(twoPlayers, resultStream);
        return when(resultStream.read.next()).then(function(result) {
          assert.equals(result.value.length, 3);
          assert.equals(result.value[0].players, ['Kalle', 'Nisse']);
          assert.equals(result.value[1].players, ['Pelle', 'Hasse']);
          assert.equals(result.value[2].players, ['Olle', undefined]);
        })
      }
    })});
