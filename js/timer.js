define(['phloem'],function(p){
  var defaultRoundTime = 3600;
  var total = defaultRoundTime;
  var roundTimerId;
  var timerStream = p.stream();
  var start;
  var elapsed = 0;
  var remaining = defaultRoundTime;
  
  function pushChange() {
    timerStream.push( {
      elapsed: elapsed,
      remaining: remaining,
      total: total,
      minutesRemaining: remaining/60 < 10 ? '0' + Math.floor(remaining/60) : Math.floor(remaining/60),
      secondsRemaining: remaining%60 < 10 ? '0' + remaining%60 : remaining%60,
    });
  };

  function reset() {
    total = defaultRoundTime;
    elapsed = 0;
    remaining = defaultRoundTime;
  };
  
  function update() {
    elapsed = running() ? start ? new Date().getTime() - start : 0 : elapsed; 
    remaining = total - Math.floor(elapsed/1000);
    pushChange();
  };
  
  function running() {
    return roundTimerId !== undefined;
  };
  
  function extendBy(time) {
    if(!running()) {
      defaultRoundTime += time;
    };
    total += time;
    update();
  };
  
  return {
    start: function(updateInterval) {
      start = new Date().getTime();
      roundTimerId = window.setInterval(function() {
        update();
      }, updateInterval || 1000);
      
      return {
        startedAt: start
      };
    },
    update:update,
    running:running,
    read:function(){return timerStream.read.next()},
    stop:function(){
      window.clearInterval(roundTimerId);
      roundTimerId = undefined;
    },
    reset:reset,
    extendBy:extendBy,
    decreaseBy:function(time){extendBy(-time);}
  }
});
