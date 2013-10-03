var config = module.exports;

config["browser tests"] = {
    environment: "browser",
    sources: ["blossom*.js",
	      "modules/when/when.js",
	      "modules/curl/src/curl/plugin/*.js",
	      "modules/less.js/dist/less-1.3.1.js"],
    resources: ['examples/**/*.*'],
    tests: ["test/*.js"],
    libs: ["modules/curl/src/curl.js", 
	   "loaderconf.js"],
    extensions: [require("buster-amd")]
};


