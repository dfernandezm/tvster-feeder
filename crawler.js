"use strict";
const debug = require("debug")("services/crawlers:crawler");
const indexer = require("./api/services/indexer/indexer");

/// - For testing only, remove when done

let crawlerService = require("./api/services/crawlers/crawlerService");

// 0 - node, 1 - JS file, from 2 -> rest of arguments
let query = process.argv[2] || "Suits";

let search = async (query) => {
    try {
        //let torrents = await crawlerService.searchInTpb(query);
        // debug("Resolved promise with torrents: ", torrents.length);
        let response = await indexer.search(query);
        debug("Search response: %o", response.hits.hits);
    } catch (err) {
        debug("Error occurred: ", err);
    }
};

search(query);
