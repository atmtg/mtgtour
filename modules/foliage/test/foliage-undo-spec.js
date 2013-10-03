define(['buster', 'foliage', 'jquery', 'foliage-event'],
       function(buster, f, $, on) {

	   var assert = buster.assert;
	   var refute = buster.refute;

	   function elemTest(test) {
	       var div = $("<div />");
	       return _.bind(test, this, div);
	   }

	   buster.testCase("undo", {
	       "undoes added element" : elemTest(function(e) {
		   var handle = f.p({id: "para"},"hello")(e);
		   assert.equals(1, $(e).children("#para").length);
		   handle.undo();
		   assert.equals(0, $(e).children("#para").length);
	       }),
	       "undoes added attribute" : elemTest(function(e) {
		   var attr = f.create({anAttribute: "withAValue"})(e);
		   assert.equals("withAValue", $(e).attr("anAttribute"));
		   attr.undo();
		   refute.defined($(e).attr('anAttribute'));
	       }),
	       "undoes added text" : elemTest(function(e) {
		   var text = f.create("some text")(e);
		   assert.equals("some text", $(e).text().trim());
		   text.undo();
		   assert.equals($(e).text().trim(), "");
	       }),
	       "undoes added subelement" : elemTest(function(e){
		   var subelem = f.p("subparagraph")(e);
		   assert.equals("subparagraph", $(e, 'p').text().trim());
		   subelem.undo();
		   assert.equals($(e, 'p').text().trim(), "");
	       }),
	       "subelement can be created with create" : elemTest(function(e){
		   var subelem = f.create(f.p("subparagraph"))(e);
		   assert.equals( $(e, 'p').text().trim(), "subparagraph",  "before undo");
		   subelem.undo();
		   assert.equals("", $(e, 'p').text().trim(),  "after undo");
	       }),
	       "added classes can be undone" : elemTest(function(e) {
		   var addEnabled = f.addClass("enabled")(e);
		   assert.equals(e.attr('class'), 'enabled')
		   addEnabled.undo();
		   refute.equals(e.attr('class'), 'enabled')
	       }),
	       "all can be undone" : elemTest(function(e) {
		   var addEnabledAndActive = f.all(
		       f.addClass("enabled"),
		       f.addClass("active"))(e);
		   assert.equals(e.attr('class'), 'enabled active');
		   addEnabledAndActive.undo();
		   assert.equals($(e).attr('class'), '');
		   
	       })
	   })
})
