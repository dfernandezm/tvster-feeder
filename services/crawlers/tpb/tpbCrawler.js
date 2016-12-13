"use strict";
const tpb = require("./tpbDataExtractor");
const urlencode = require('urlencode');
const format = require('string-format');
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils");
const config = require("./tpbConfig.json");


const tpbCrawler = {};

// Method mode of string format
format.extend(String.prototype);
var crawledParts = [];

tpbCrawler.crawlTvShows = () => {

    let tvShowsUrl = config.baseUrl + config.tvShowsUrl;
    let tvShowsHdUrl = config.baseUrl + config.tvShowsHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [tvShowsUrl, tvShowsHdUrl];
    config.contentType = "TV_SHOW";
    config.limitPages = 50;
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, crawlFinish(config.resultsFilePath));
}

tpbCrawler.crawlMovies = () => {

    let moviesUrl = config.baseUrl + config.moviesUrl;
    let moviesHdUrl = config.baseUrl + config.moviesHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [moviesUrl, moviesHdUrl];
    config.contentType = "MOVIE";
    config.limitPages = 50;
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, crawlFinish(config.resultsFilePath));
}

/**
 * Returns a promise that resolves when limitPages have been crawled from the given 'query' on TPB
 *
 * @param query
 * @returns {Promise}
 */
tpbCrawler.search = (query) => {
    let urlEncodedQuery = urlencode(query, "utf8");
    let searchPathWithQuery =  config.searchTvShowsPath.format(urlEncodedQuery);
    let searchUrl = config.baseUrl + searchPathWithQuery;
    config.urls = [searchUrl];
    config.crawlType = "SEARCH";
    config.limitPages = 2;
    config.torrents = [];
    crawledParts.push(searchUrl);

    return new Promise(function(resolve, reject) {
        return crawlerUtils.crawlWebsitePromise(config, crawlIndividualPage, crawlFinishSearchPromise(config)).then(function(torrents) {
            console.log("Resolved promise crawler promise, will return found torrents");
            return resolve(torrents);
        });
    });
}

function crawlIndividualPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        var torrentsRead = tpb.extractTorrentDataForSinglePage($);
        for (let torrent of torrentsRead) {
            torrent.contentType = config.contentType;
            torrentUtils.parseTorrentLink(config, torrent, torrent.magnetLink, crawledParts, false);
        }

        if (crawledParts.length === config.limitPages && config.crawlType === "SEARCH") {
            console.log("Finishing search here");
            return true;
        } else {
            let paginationLinks = $("#searchResult").parent().next("div").find("a");
            if (config.crawlType === "SEARCH") {
                // Get the last link of the pager -- it is the nextPage link
                paginationLinks = paginationLinks.last();
            }

            //noinspection JSUnresolvedVariable
            continueWithPagination(config, crawler, paginationLinks, $);
        }
    }
}

function continueWithPagination(config, crawler, paginationSelector, $) {
    $(paginationSelector).each(function (index, element) {
        if (index < (config.limitPages - 1)) {
            var newPage = $(element).attr("href");
            if (crawledParts.indexOf(newPage) == -1) {
                crawledParts.push(newPage);
                let newUrl = config.baseUrl + newPage;
                console.log("New Url to visit: " + newUrl);
                crawler.queue(newUrl);
            }
        } else {
            console.log("Stopping pagination as limit was reached");
        }
    });
}

function crawlFinish(resultsFilePath) {
    return function (pool) {
        if (config.resultsFilePath) {
            fileUtils.appendFooterToFile(resultsFilePath);
        }
        console.log("Finished");
    }
}

/**
 *  This function creates a closure used to resolve the crawler promise once finished. It returns a function following
 *  the contract of the "onDrain" event emitted by the crawler when it finishes execution. The returned function returns
 *  the actual result (the list of torrents found)
 * @param config
 * @returns {Function}
 */
function crawlFinishSearchPromise(config) {
    return function (pool) {
        if (config.torrents) {
            return config.torrents;
        }
        console.log("Finished");
    }
}

module.exports = tpbCrawler;