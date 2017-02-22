"use strict";

// In order to import .ts directly into .js file using require
require('ts-node').register({ /* options */ });
const EliteTorrentCrawler = require("./EliteTorrentCrawler.ts").EliteTorrentCrawler;
const EliteTorrentDataExtractor = require("./EliteTorrentDataExtractor").EliteTorrentDataExtractor;

const f = (a) => {
    return "a - " + a;
}

let crawler = new EliteTorrentCrawler();
let dataExtractor = new EliteTorrentDataExtractor();

dataExtractor.extractData("TV_SHOW", f);
crawler.crawlIndividualPage();
