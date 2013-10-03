define(['blossom', 
	'when', 
	'require'], 
       function(blossom, 
		when, 
		req) {

	   var assert = buster.assert;

	   var resolve = function(name) {
	       var defered = when.defer();
	       blossom.load(name, req, defered.resolve, {});
	       return defered.promise;
	       
	   };
	   
	   var rules = function(sheet) {
	       var ruleIndex = 0;
	       var result = {};
	       for (ruleIndex = 0; ruleIndex < sheet.rules.length; ruleIndex ++) {
		   var rule = sheet.rules[ruleIndex];
		   result[rule.selectorText] = rule.style.cssText;
	       }
	       return result;
	   }

	   var styleList = function() {
	       var styleSheets = {};
	       var sheetIndex = 0;
	       for(sheetIndex = 0; sheetIndex < window.document.styleSheets.length; sheetIndex++) {
		   sheet = window.document.styleSheets[sheetIndex];
		   styleSheets[sheet.ownerNode.id] = rules(sheet);
	       }
	       return styleSheets;
	   }
	   
	   buster.testCase("blossom", {
	       'loads a leaf less-stylesheet': function() {
		   var lessToLoad = 'examples/leaf.less'
		   return when(resolve(lessToLoad)).then(
		       function(value){
			   assert.match(styleList(),
				       {'less:examples-leaf' : 
					{'#content' : 'color: rgb(77, 146, 111);'}});
		       }
		   )
	       },
	       'loads a file that imports a leaf' : function() {
		   var lessToLoad = 'examples/one-import.less';
		   return when(resolve(lessToLoad)).then(
		       function(value){
			   assert.match(styleList(), 
					{'less:examples-one-import': 
					 {'h4':"color: rgb(187, 187, 187)"}});
		       }
		   )
	       }
	   });
       })
