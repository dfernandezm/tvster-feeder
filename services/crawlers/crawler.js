"use strict";

/// - For testing only, remove when done

let crawlerService = require("./crawlerService");
// crawlerService.searchInTpb("asc").then(function(torrents) {
//     console.log("Resolved promise with torrents: " + JSON.stringify(torrents));
// });

crawlerService.crawlTpb();