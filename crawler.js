"use strict";
const debug = require("debug")("services/crawlers:crawler");
/// - For testing only, remove when done

let crawlerService = require("./crawlerService");

// 0 - node, 1 - JS file, from 2 -> rest of arguments
let query = process.argv[2] || "Suits";
 crawlerService.searchInTpb(query).then(function(torrents) {
     debug("Resolved promise with torrents: %o", JSON.stringify(torrents));
 });

// crawlerService.searchInDivxTotal(query).then(function(torrents) {
//      console.log("Resolved promise with torrents: " + JSON.stringify(torrents));
// });

//crawlerService.crawlTpb();
//crawlerService.crawlDivxTotal();
