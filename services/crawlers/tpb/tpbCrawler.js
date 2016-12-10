"use strict";
const tpb = require("./tpb");
const _  = require("lodash");
const format = require('string-format');
const torrentUtils = require("../torrentUtils");
const crawlerService = require("../crawlerService")
const crawlerUtils = require("../crawlerUtils")
const tpbCrawler = {};
var crawledParts = [];

tpbCrawler.crawl = () => {
  let config = {};
  config.rateLimits = 1000;
  config.maxConnections = 8;
  config.baseUrl = "https://pirateproxy.vip";
  let tvShowsUrl = config.baseUrl + "/browse/205";
  config.urls = [tvShowsUrl];

  crawlerService.crawlWebsite(config, crawlEach, crawlFinish);
}

function crawlEach(config, crawler, result, $) {
    var torrentsRead = tpb.extractTorrentDataForSinglePage($);
    for (let torrent of torrentsRead) {
      torrentUtils.parseTorrentLink(torrent, torrent.magnetLink, crawledParts, true);
    }

    let paginationLinks = $("#searchResult").find("tr").last().find("a");
    continueWithPagination(config.baseUrl, crawler, paginationLinks, $);
}

function continueWithPagination(baseUrl, crawler, selector, $) {
  $(selector).each(function(index, element) {
    var newPage = $(element).attr("href");
    if (crawledParts.indexOf(newPage) == -1) {
      crawledParts.push(newPage);
      let newUrl = baseUrl + newPage;
      console.log("New Url to visit: " + newUrl);
      crawler.queue(newUrl);
    }
  });
}

function crawlFinish(pool) {
  crawlerUtils.appendFooterToFile("/tmp/torrents.json");
  console.log("Finished");
}

module.exports = tpbCrawler;