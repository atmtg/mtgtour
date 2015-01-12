var config = module.exports;

config["browser tests"] = {
    environment: "browser",
    sources: ["js/*.js",
              "modules/foliage/foliage*.js",
              "modules/phloem/phloem.js",
              "modules/blossom/blossom.js",
              "node_modules/lodash/lodash.js",
              "modules/bud/bud.js",
              "modules/when/when.js"
             ],
    tests: ["test/*.js"],
    libs: ["modules/curl/src/curl.js",
           "loaderconf.js",
           "js/ext/*.js"],
    extensions: [require("buster-amd")]
};
