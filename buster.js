var config = module.exports;

config["browser tests"] = {
    environment: "browser",
    sources: ["js/index.js",
              "modules/foliage/foliage*.js",
              "modules/phloem/phloem.js",
              "modules/lodash/lodash.js",
              "modules/when/**/*.js"
             ],
    tests: ["test/*.js"],
    libs: ["modules/curl/src/curl.js",
           "loaderconf.js",
           "js/ext/*.js"],
    extensions: [require("buster-amd")]
};
