define(['jquery', 'lodash'], function($, _) {
    var create = function(val) {
	return function(elem) {
	    switch(typeof val){
		case "object": {
		    elem.attr(val);
		    return {
			undo:function() {
			    var attr;
			    for(attr in val) {
				elem.removeAttr(attr);
			    }
			}
		    }
		}
		case "string": {
		    var oldText = elem.text();
		    elem.append(val);
		    return {
			undo:function(){
			    elem.text(oldText);
			}
		    }
		} 
       	        case "function": {
                    var handle = val(elem);
		    return {
			undo: handle.undo
		    }
		};
	    }
	}
    }

    function groupArgs(args) {
	var children = [];
	var attributes  = {};
	function textNode(text) {
	    return create('\n'+text);
	}

	var handleArg = function (arg) {
	    switch(typeof arg) {
	    case "string": 
                switch (arg.charAt(0)) {
                case "#": handleObject({'id': arg.substr(1)}); break;
                case ".": children.push(addClass(arg.substr(1))); break;
                default: children.push(textNode(arg)); break;
                };break;
	    case "object": handleObject(arg); break;
	    case "number" :children.push(textNode(arg)); break;
	    case "undefined" : break;
		
	    default: children.push(arg);
	    }
	}

	var handleObject = function(obj) {
	    if($.isArray(obj)) {
		_.each(obj, function (item) {
		    handleArg(item);
		});
	    } else {
		attributes = _.extend(attributes, obj);     
	    }
	}
	

	
	_.each (args, handleArg)
	    return {
		children: children,
		attributes: attributes
	    }
    }
    
    var e = function(name, decorate) {
	return function() {
	    var args = groupArgs(arguments);
	    return function(parent) {
		var me = $('<'+name+' />');
		create(args.attributes)(me);
		for ( child in args.children ) {
		    var ch = args.children[child]
		    ch(me);
		}
		if (decorate) {
		    decorate (me);
		}
		var result = me.appendTo(parent);
		result.undo = function() {result.remove()}
		return result;
	    }
	}
    }
    
    function all() {
	var children = arguments;
	return function(element) {
	    var done = _.map(children, function(child){
		var undo = create(child)(element);
		if (undo && undo.undo) {
		    return undo;
		}
		else {
		    throw Error("child of all did not provide an undo! ("+child+")");
		}
	    })

	    return {undo: function() {
		_.each(done, function(child){child.undo()})
		    }
		   }
	}                          
    }

    function into(elem, child) {
	return function(element) {
	    var res = child($(elem, element))
	    console.log(res);
	    return res;
	}
    }


    var res = _.reduce(
	['a',
	 'abbr',
	 'acronym',
	 'address',
	 'area',
	 'b',
	 'base',
	 'bdo',
	 'big',
	 'blockquote',
	 'body',
	 'br',
	 'button',
	 'caption',
	 'cite',
	 'code',
	 'col',
	 'colgroup',
	 'dd',
	 'del',
	 'dfn',
	 'div',
	 'dl',
	 'dt',
	 'em',
	 'fieldset',
	 'form',
	 'h1',
	 'h2',
	 'h3',
	 'h4',
	 'h5',
	 'h6',
	 'head',
	 'hr',
	 'html',
	 'i',
	 'img',
	 'input',
	 'ins',
	 'kbd',
	 'label',
	 'legend',
	 'li',
	 'link',
	 'map',
	 'meta',
	 'noscript',
	 'object',
	 'ol',
	 'optgroup',
	 'option',
	 'p',
	 'param',
	 'pre',
	 'q',
	 'samp',
	 'script',
	 'select',
	 'small',
	 'span',
	 'strong',
	 'style',
	 'sub',
	 'sup',
	 'table',
	 'tbody',
	 'td',
	 'textarea',
	 'tfoot',
	 'th',
	 'thead',
	 'title',
	 'tr',
	 'tt',
	 'ul',
	 'var'],
	function(res, name) {
	    res[name] = e(name);
	    return res;
	},
	{element:e});
    

    var addClass = function(c) {
	return function(e) {
	    e.addClass(c);
	    return {
		undo: function(){e.removeClass(c)}
	    }
	}
    }

    res.all = all;
    res.into = into;
    res.create = create;
    res.addClass = addClass;
    return res;
});
