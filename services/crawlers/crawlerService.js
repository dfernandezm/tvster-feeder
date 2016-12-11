"use strict";
const tpbCrawler = require("./tpb/tpbCrawler")
const crawlerService = {};

crawlerService.crawlTpb = () => {
  tpbCrawler.crawlTvShows();
}

crawlerService.searchInTpb = (query) => {
  //tpbCrawler.liveSearch(query);
}


module.exports = crawlerService;
