"use strict";

const _ = require("lodash");
const Crawler = require("node-webcrawler");
const crawlerUtils = {};

crawlerUtils.crawlWebsite = (config, crawlingBlock, crawlerFinishedBlock) => {
  var crawledParts = [];
  let crawler = instantiateCrawler(config, crawledParts, crawlingBlock, crawlerFinishedBlock);
  startCrawler(crawler, config.urls);
}

// Promisified version of crawler, the crawlerFinishedBlock is used to resolve the promise
crawlerUtils.crawlWebsitePromise = (config, crawlingBlock, crawlerFinishedBlock) => {
    return new Promise(function(resolve, reject) {
        let crawler = new Crawler({
            maxConnections : config.maxConnections,
            rateLimits: config.rateLimits,
            callback : function (error, result, $) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    if (_.isFunction($)) {
                        crawlingBlock(config, crawler, result, $, []);
                    } else {
                        console.log("$ is not a function -- terminating");
                    }
                }
            },
            onDrain: function (pool) {
                return resolve(crawlerFinishedBlock(pool));
            }
        });

        crawler.queue(config.urls);
    });
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

module.exports = crawlerUtils;
