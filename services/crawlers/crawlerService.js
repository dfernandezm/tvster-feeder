"use strict";
const tpbCrawler = require("./tpb/tpbCrawler")
const crawlerService = {};

crawlerService.crawlTpb = () => {
  tpbCrawler.crawlTvShows();
}

crawlerService.searchInTpb = (query) => {
  return tpbCrawler.search(query);
}


module.exports = crawlerService;
