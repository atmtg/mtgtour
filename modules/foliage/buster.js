var config = module.exports;

config["browser tests"] = {
    environment: "browser",
    sources: ["foliage*.js",
	      "modules/lodash/lodash.js"],
    tests: ["test/*.js"],
    libs: ["modules/curl/src/curl.js", 
	   "loaderconf.js", 
	   "ext/*.js"],
    extensions: [require("buster-amd")]
};


