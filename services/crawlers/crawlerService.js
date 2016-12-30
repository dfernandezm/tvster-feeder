"use strict";
const tpbCrawler = require("./tpb/tpbCrawler")
const divxTotalCrawler = require("./divxtotal/divxTotalCrawler")
const crawlerService = {};

crawlerService.crawlTpb = () => {
  tpbCrawler.crawlTvShows();
}

crawlerService.searchInTpb = (query) => {
  return tpbCrawler.search(query);
}

crawlerService.crawlDivxTotal = () => {
  divxTotalCrawler.crawlMovies();
}

crawlerService.searchInDivxTotal = (query) => {
  return divxTotalCrawler.search(query);
}

module.exports = crawlerService;
