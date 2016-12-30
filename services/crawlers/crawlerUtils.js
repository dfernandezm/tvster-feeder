"use strict";

const _ = require("lodash");
const Promise = require("bluebird");
const Crawler = require("node-webcrawler");
const crawlerUtils = {};

crawlerUtils.crawlWebsite = (config, crawlingBlock, crawlerFinishedBlock) => {
  var crawledParts = [];
  let crawler = instantiateCrawler(config, crawledParts, crawlingBlock, crawlerFinishedBlock);
  startCrawler(crawler, config.urls);
}

crawlerUtils.crawlWebsitePromise = (config, crawlingBlock, crawlerFinishedBlock) => {
    return new Promise(function(resolve, reject) {
        var crawledParts = [];
        let crawler = instantiateCrawler(config, crawledParts, crawlingBlock, onDrainResolver(config, resolve, crawlerFinishedBlock));
        startCrawler(crawler, config.urls);
    });
}

function onDrainResolver(config, resolve, crawlerFinishedBlock) {
  return function (pool) {
      if (config.searchPromises && config.searchPromises.length > 0) {
          // Wait for all search promises to resolve before resolving the crawler one
          Promise.all(config.searchPromises).then((data) => {
              return resolve(crawlerFinishedBlock());
          });
      } else {
          // Resolve the crawler promise
          return resolve(crawlerFinishedBlock());
      }
  }
}

let startCrawler = (crawler, urls) => {
  crawler.queue(urls);
}

let instantiateCrawler = (config, crawledParts, crawlingBlock, onDrainResolver) => {
  let crawler = new Crawler({
    maxConnections: config.maxConnections,
    rateLimits: config.rateLimits,
    callback: function (error, result, $) {
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
    onDrain: onDrainResolver
  });

  return crawler;
}

module.exports = crawlerUtils;
