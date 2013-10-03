define(['buster', 
        'bud', 
        'foliage',
        'foliage/foliage-event',
        'phloem',
        'jquery'], 
       function(buster, b, f, on, phloem, $) {
    function withContext(callback) {
        return function() {
            callback($('<div />'));
        };
    }
           
    var assert = buster.assert;
    var refute = buster.refute;

    buster.testCase("scope", {
        "returned element gets displayed" : withContext(function(ctx){
            f.div(b.scope(
                    function() {
                        var message = "hello " + "world";
                        return f.p("#somep", message);
                    }
                ))(ctx);
            
            assert.equals($(ctx, "#somep").text().trim(), "hello world");
        }),
        "returned element can be undone" : withContext(function(ctx){
            var elem = f.div(b.scope(
                    function() {
                        var message = "now you see it";
                        return f.p("#somep", message);
                    }
                ))(ctx);
            assert.equals($(ctx, "#somep").text().trim(), "now you see it");
            elem.undo();
            assert.equals($(ctx, "#somep").text().trim(), "");
            
        })

    });

    buster.testCase("bind", {
        "no value no element" : withContext(function(ctx){
            var stream = phloem.stream();
            f.div(b.bind(stream, f.p))(ctx);
            
            assert.equals($(ctx, "p").text().trim(), "");
        }),
        "creates element from pushed value" : withContext(function(ctx){
            var stream = phloem.stream();
            f.div(b.bind(stream.read, f.p))(ctx);
            stream.push("pushed value");
            
            assert.equals($(ctx, "p").text().trim(), "pushed value");
        }),
        "keeps only last pushed value" : withContext(function(ctx){
            var stream = phloem.stream();
            stream.push("first value");
            f.div(b.bind(stream.read, f.p))(ctx);
            assert.equals($(ctx, "p").text().trim(), "first value");
            stream.push("second value");
            assert.equals($(ctx, "p").text().trim(), "second value");
        })
    });

    buster.testCase("bus", {
        "can expose value": withContext(function(ctx) {
            b.bus(function(bus) {
                return f.all(
                    f.input("#source", {value: "from source"}, bus.expose),
                    f.input("#target", {value: "unchanged"}, bus.expose,
                        on.click(function() {
                            bus.target(bus.source());
                        })));
            })(ctx);
            assert.equals($('#target', ctx).val().trim(), "unchanged");
            $("#target", ctx).click();
            assert.equals($('#target', ctx).val().trim(), "from source");
        })
    });
});
