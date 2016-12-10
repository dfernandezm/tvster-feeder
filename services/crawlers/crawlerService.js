"use strict";
const _  = require("lodash");
const Crawler = require("node-webcrawler");

const crawlerService = {};

crawlerService.crawlWebsite = (config, crawlingBlock, crawlerFinishedBlock) => {
  var crawledParts = [];
  let crawler = instantiateCrawler(config, crawledParts, crawlingBlock, crawlerFinishedBlock);
  startCrawler(crawler, config.urls);
}

let startCrawler = (crawler, urls) => {
  crawler.queue(urls);
}

let instantiateCrawler = (config, crawledParts, crawlingBlock, onDrainFunction) => {
  let crawler = new Crawler({
    maxConnections : config.maxConnections,
    rateLimits: config.rateLimits,
    callback : function (error, result, $) {
      if (error) {
        console.log(error);
        return false;
      } else {
        if (_.isFunction($)) {
          crawlingBlock(config, crawler, result, $, crawledParts);
        } else {
          console.log("$ is not a function -- terminating");
        }
      }
    },
    onDrain: onDrainFunction
  });
  
  return crawler;
}

module.exports = crawlerService;
