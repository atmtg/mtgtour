define(['phloem'],function(p){
    var ROUND_TIME = 3600;
    var total = ROUND_TIME;
    var roundTimerId;
    var timerStream = p.stream();
    var start;
    var elapsed = 0;
    var remaining = ROUND_TIME;

    function update() {
        elapsed = start ? new Date().getTime() - start : 0; 
        remaining = total - Math.floor(elapsed/1000);
        timerStream.push( {
            elapsed: elapsed,
            remaining: remaining,
            total: total,
            minutesRemaining: remaining/60 < 10 ? '0' + Math.floor(remaining/60) : Math.floor(remaining/60),
            secondsRemaining: remaining%60 < 10 ? '0' + remaining%60 : remaining%60,
        });
    };

    return {
        start: function(updateInterval) {
            total = ROUND_TIME;
            start = new Date().getTime();
            roundTimerId = window.setInterval(function() {
                update();
            }, updateInterval || 1000);
            
            return {
                startedAt: start
            };
        },
        update:update,
        running: function(){return roundTimerId !== undefined},
        read:function(){return timerStream.read.next()},
        stop:function(){
            window.clearInterval(roundTimerId);
            roundTimerId = undefined;
            update();
        },
        extendBy:function(time){total += time; update();},
        decreaseBy:function(time){total -= time; update();}
    }
});
