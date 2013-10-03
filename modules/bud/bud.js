define(['phloem', 'foliage', 'jquery'], function(phloem, f, $) {
  function bind (stream , element) {
    return function(parent) {
      var last = {undo: function(){}};
      phloem.each(stream, function(value) {
        last.undo();
        last = element(value)(parent);
      });
    }
  }
  return {
    scope: function(s) {
      return s();
    },
    bind: bind,
    bus: function(fn) {
      var bus = {};
      bus.expose = function(element) {
        var jqelem = $(element);
        bus[jqelem.attr('id')] = function(v){return  v ? jqelem.val(v) : jqelem.val()};
      };
      return f.all(fn(bus));
    },
    match: function (stream) {
      var cases = Array.prototype.slice.call (arguments, 1);
      return bind (stream, function (value) {
        var c;
        for (c in cases) {
          var result = cases [c] (value);
          if (result) {
            return result;
          }
        }
        return f.span ();
      })
    },
    when: function (matcher) {
      return {
        then: function (outcome) {
          return function (value) {
            var matched = matcher (value);
            if (matched) {
              return outcome (matched);
            }
          }
        }
      }
    }
  }
});
