define(['phloem', 'when'], function(phloem, when) {
    var assert = buster.assert;
    buster.testCase("either",{
	'right value can be resolved once' : function() {
	    var either = phloem.either();
	    either.right("event");
	    return when(either.read.right()).then(function(value) {
		assert.equals(value, "event");
	    });
	},
	'left can be resolved once' : function() {
	    var either = phloem.either();
	    either.left("value");
	    return when(either.read.left()).then(function(value) {
		assert.equals(value, "value");
	    });
	},
	'left can be resolved after right' : function() {
	    var either = phloem.either();
	    return when("value")
		.then(either.right)
		.then(either.read.right)
		.then(either.left)
		.then(either.read.left)
		.then(either.right)
		.then(either.read.right)
		.then(function(value){
		    assert.equals(value, "value");
		});

	},
	'right can be resolved after left' : function() {
	    var either = phloem.either();
	    return when("value")
		.then(either.left)
		.then(either.read.left)
		.then(either.right)
		.then(either.read.right)
		.then(either.left)
		.then(either.read.left)
		.then(function(value){
		    assert.equals(value, "value");
		});

	}
    })

    buster.testCase("not",{
	'when right value left value is resolved' : function() {
	    var either = phloem.not(phloem.either());
	    either.right("event");
	    return when(either.read.left()).then(function(value) {
		assert.equals(value, "event");
	    });
	},
	'when left value right value is resolved' : function() {
	    var either = phloem.not(phloem.either());
	    either.left("value");
	    return when(either.read.right()).then(function(value) {
		assert.equals(value, "value");
	    });
	}
    })


    buster.testCase("optional", {
	'can adapt an either': function() {
	    var either = phloem.either();
	    var optional = phloem.optional(either);
	    assert.same(either.left, optional.set);
	    assert.same(either.right, optional.clear);
	    assert.same(either.read.left, optional.read.present);
	    assert.same(either.read.right, optional.read.absent);
	}
    })

    buster.testCase("whenever", {
	"chain left with whenever" : function() {
	    var either = phloem.either();
	    var dependent = phloem.whenever(either.read).then(function(value) {
		return [value, "from dependent"]
	    })

	    return when("from either")
		.then(either.left)
		.then(dependent.left)
		.then(
		    function(value) {
			assert.equals(value, ["from either", "from dependent"]);
		    }
		);
	},
	"chain right with whenever" : function() {
	    var either = phloem.either();
	    var dependent = phloem.whenever(either.read).otherwise(function(value) {
		return [value, "from dependent"]
	    })

	    return when("from either")
		.then(either.right)
		.then(dependent.right)
		.then(
		    function(value) {
			assert.equals(value, ["from either", "from dependent"]);
		    }
		);
	},
	"chain can oscillate between right and left" : function() {
	    var either = phloem.either();
	    var dependent = phloem.whenever(either.read)
		.then(function(left){
		    return "left: " + left;
		})
		.otherwise(function(right){
		    return "right: " + right;
		});
	    return when("from either")
		.then(either.left)
		.then(dependent.left)
		.then(either.right)
		.then(dependent.right)
		.then(either.left)
		.then(dependent.left)
		.then(function(result) {
		    assert.equals("left: right: left: from either", result);
		})
	}
    })

    buster.testCase("cons", {
	"- just value - ": {
	    "a new value is resolved" : function() {
		var cons = phloem.cons("head");
		return when(cons.value)
		    .then(function(value) {
			assert.match(value, "head");
		    });
	    },
	    "next is EOF" : function() {
		var cons = phloem.cons("head");
		return when(cons)
		    .then(phloem.next)
		    .then(function(value) {
			assert.equals(value, phloem.EOF);
		    });
	    }
	}
    }),
    
    buster.testCase("stream", {
	"- when push -": {
	    "a new value is resolved" : function() {
		var stream = phloem.stream();
		var next = stream.read.next();
		return when("value")
		    .then(stream.push)
		    .then(stream.next)
		    .then(function(value) {
			assert.match(value,
				     {value:"value", next:function(val){
					 return when.isPromise(val())}})
		    });
	    },
	    "more than one new value is resolved" : function() {
		var stream = phloem.stream();
		var next = stream.read.next();
		return when("value")
		    .then(stream.push)
		    .then(stream.next)
		    .then(function(first) {
			stream.push(phloem.value(first) + " second")
			return phloem.next(first)})
		    .then(stream.next)
		    .then(function(value) {
			assert.equals(phloem.value(value), "value second")
		    });
	    },
	    "the last pushed value is read on next" : function() {
		var stream = phloem.stream();
		stream.push("first value");
		stream.push("last value");

		return when(stream.read.next())
		    .then(function(val) {
			assert.match(val, {value: "last value"})
		    })
	    },
	    "stream sends EOF on close" : function() {
		var stream = phloem.stream();
		var next = stream.read.next();
		stream.close();

		return when(next).then(function(value) {
		    assert.same(value, phloem.EOF);
		})
	    },
	    "always returns EOF after close" : function() {
		var stream = phloem.stream();
		stream.close();
		return when(stream.read.next()).then(function(value) {
		    assert.same(value, phloem.EOF);
		})
	    }

	}
    });    

    buster.testCase("queue", {
	"- when push -": {
	    "a new value is resolved" : function() {
		var queue = phloem.queue();
		var next = queue.next();
		return when("new value")
		    .then(function(val) {
			var pushed = queue.push(val)
			return when(queue.next());
		    })
		    .then(function(val){
			return queue.next();
		    })
		    .then(function(entry) {
			assert.match(entry.value, ['new value'])
		    })
	    },
	    "several values in a row are resolved pre listen" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(function(val){return queue.push("2. new value")})
		    .then(function(val){return queue.push("3. new value")})
		    .then(queue.next)
		    .then(phloem.value)
		    .then(function(value) {
			assert.match(value, ['new value', '2. new value', '3. new value'])
		    })
	    },
	    "a several values in a row are resolved post listen" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(queue.next)
		    .then(function(val){queue.push("2. "+phloem.value(val))
					return phloem.next(val)})
		    .then(function(val){queue.push("3. "+phloem.value(val)[0])
					return phloem.next(val)})
		    .then(queue.next)
		    .then(phloem.value)
		    .then(function(value) {
			assert.match(value, ['new value', '2. new value', '3. new value'])
		    })
	    },
	    "console last added is available under add" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(queue.next)
		    .then(phloem.value)
		.then(function(val) {
		    assert.equals(val.added, ["new value"])
		})
	    },
	    "console drop removes element" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(function() {return queue.push("other value")})
		    .then(function() {return queue.drop("new value")})
		    .then(queue.next)
		    .then(phloem.value)
		    
		.then(function(val) {
		    assert.match(val, ["other value"]);
		})
	    },
	    "console dropped elements are reported" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(function(){return queue.drop("new value")})
		    .then(queue.next)
		    .then(phloem.value)
		    
		.then(function(val) {
		    assert.match(val.dropped, ["new value"]);
		})
	    },
	    "a function for drop-id can be specified" : function() {
		var queue = phloem.queue(function(val) {return val.name});
		return when({name: "new-value", value: 123456, attr: {v: "val"}})
		    .then(queue.push)
		    .then(function(){return queue.drop({name: "new-value"})})
		    .then(queue.next)
		    .then(phloem.value)
		    .then(function(val) {
			assert.match(val, []);
			assert.match(val.dropped, [{name: "new-value", value:123456, attr:{v: "val"}}]);
		    })
	    }

	}

    })

    buster.testCase("filter", {
	"lets through strings matching regex" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /a+/);

	    var promise = when(filtered.read.next())
	    stream.push("aaaa");

	    return promise.then(function(val) {
		assert.match(val, {value: "aaaa"});
	    });

	},
	"does not let through strings not matching regex" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /a+/);

	    var promise = when(filtered.read.next())
	    stream.push("bbbb");
	    stream.push("aaaa");

	    return promise.then(function(val) {
		assert.match(val, {value: "aaaa"});
	    })
	},
	"lets groupmatches through as arrays" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /(a+)(b+)/);

	    var promise = when(filtered.read.next())
	    stream.push("aaaabb");

	    return promise.then(function(val) {
		assert.match(val, {value: ["aaaa", "bb"]});
	    });

	},
	"function that returns falsey does not match" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), function(val){if(val === "abc"){return "hepp"}});

	    var promise = when(filtered.read.next())
	    stream.push("abcd");
	    stream.push("abc");

	    return promise.then(function(val) {
		assert.match(val, {value: "hepp"});
	    });

	},
	"unmatched item can be read" : function() {
	    var stream = phloem.stream();
	    var filter = phloem.filter(stream.read.next(), /abc/);

	    var matched = filter.read.next();
	    var unmatched = filter.read.unmatched();
	    var promise = when.all([matched, unmatched]);

	    stream.push("abc");
	    stream.push("ddd");

	    return promise.then(function(vals) {
		assert.match(vals, [{value:'abc'}, {value:'ddd'}]);
	    });
	}
    }),

    buster.testCase("eitherStream", {
	"left when left stream writes": function(){
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());
	    

	    promise =  when(eitherStream.read.left())
	    
	    left.push("left");

	    return promise.then(function(stream) {
		return stream();
	    })
	    .then(function(val) {
		assert.match(val, {value: "left"});
	    })
	},
	"right when right stream writes": function(){
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());
	    
	    promise =  when(eitherStream.read.right())
	    
	    right.push("right");

	    return promise.then(function(stream) {
		return stream();
	    }).then(function(next){
		assert.match(next, {value: "right"});
	    })
	},
	"closes left when switching to right" : function() {
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());

	    var eitherLeft = eitherStream.read.left();
	    var eitherRight = eitherStream.read.right();

	    promise = when(eitherLeft)
		.then(function(stream) {
		    return stream();
		})
		.then(function(val) {
		    assert.match(val, {value: "left value"});
		    right.push("switched to right");
		    return phloem.next(val);
		})
		.then(function(val) {
		    assert.same(val, phloem.EOF);
		    return eitherStream.read.right();
		})
		.then(function(stream) {
		    return stream();
		})
		.then(function(val) {
		    assert.match(val, {value: "switched to right"});
		});
	    
	    left.push("left value");
	    return promise;
	}
    })

    buster.testCase("events", {
	"push single sends added event" : function() {
	    var events = phloem.events();
	    promise = when(events.read.next()).
		then(phloem.value).
		then(function(value) {
		    assert.equals(value, {added: ["some value"]});
		});

	    events.push("some value");
	    return promise;
	},
	
	"drop single sends dropped event" : function() {
	    var events = phloem.events();
	    promise = when(events.read.next()).
		then(phloem.value).
		then(function(value) {
		    assert.equals(value, {dropped: ["some value"]});
		});
	    events.drop("some value");
	    return promise;
	},
	"push many sends added event" : function() {
	    var events = phloem.events();
	    promise = when(events.read.next()).
		then(phloem.value).
		then(function(value) {
		    assert.equals(value, {added: ["some value1", "some value2"]});
		});

	    events.push(["some value1", "some value2"]);
	    return promise;
	},
	
	"drop single sends dropped event" : function() {
	    var events = phloem.events();
	    promise = when(events.read.next()).
		then(phloem.value).
		then(function(value) {
		    assert.equals(value, {dropped: ["some value1", "some value2"]});
		});
	    events.drop(["some value1", "some value2"]);
	    return promise;
	},

	"snap sends snapshot event" : function() {
	    var events = phloem.events();
	    promise = when(events.read.next()).
		then(phloem.value).
		then(function(value) {
		    assert.equals(value, {snap: ["some value1", "some value2"]});
		});
	    events.snap(["some value1", "some value2"]);
	    return promise;
	}

    });
})
