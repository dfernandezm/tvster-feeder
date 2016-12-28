"use strict";
const _ = require("lodash");
const tpb = require("./tpbDataExtractor");
const urlencode = require('urlencode');
const format = require('string-format');
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils");
const config = require("./tpbConfig.json");

const tpbCrawler = {};

// Method mode of string format function, 'format' can be called directly on a string variable
format.extend(String.prototype);
var crawledParts = [];

tpbCrawler.crawlTvShows = () => {

    let tvShowsUrl = config.baseUrl + config.tvShowsUrl;
    let tvShowsHdUrl = config.baseUrl + config.tvShowsHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [tvShowsUrl, tvShowsHdUrl];
    config.contentType = "TV_SHOW";
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, onCrawlFinish(config.resultsFilePath));
}

tpbCrawler.crawlMovies = () => {

    let moviesUrl = config.baseUrl + config.moviesUrl;
    let moviesHdUrl = config.baseUrl + config.moviesHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [moviesUrl, moviesHdUrl];
    config.contentType = "MOVIE";
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, onCrawlFinish(config.resultsFilePath));
}

/**
 * Returns a promise that resolves when 'limitPages' have been crawled from the given search 'query' has been
 * issued against TPB
 *
 * @param query
 * @returns {Promise}
 */
tpbCrawler.search = (query) => {
    let urlEncodedQuery = urlencode(query, "utf8");

    //let searchPathWithQuery =  config.searchTvShowsPath.format(urlEncodedQuery);
    let searchPathWithQuery =  config.searchGeneralPath.format(urlEncodedQuery);
    let searchUrl = config.baseUrl + searchPathWithQuery;

    let searchConfig = {};
    searchConfig.urls = [searchUrl];
    searchConfig.crawlType = "SEARCH";
    searchConfig.limitPages = 1;
    searchConfig.torrents = [];

    // Augment config with custom config for searching
    let currentConfig = _.extend(config, searchConfig)
    crawledParts.push(searchUrl);

    return new Promise(function(resolve, reject) {
        return crawlerUtils.crawlWebsitePromise(currentConfig, crawlIndividualPage, onSearchFinish(currentConfig)).then(function(torrents) {
            console.log("Resolved promise for crawler, will return search results");
            return resolve(torrents);
        });
    });
}

function crawlIndividualPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        let isSearch = config.crawlType === "SEARCH";
        var torrentsRead = tpb.extractTorrentDataForSinglePage($);
        for (let torrent of torrentsRead) {
            torrent.contentType = config.contentType;
            torrentUtils.parseTorrentLink(config, torrent, torrent.magnetLink, crawledParts, !isSearch);
        }

        if (crawledParts.length === config.limitPages && isSearch) {
            console.log("Finishing search");
            return true;
        } else {

            let paginationLinks;

            if (isSearch) {
                // Get the last link of the pager -- it is the nextPage link (search results view)
                paginationLinks = $("#searchResult").parent().next("div").find("a").last();
            } else {
                // Get all pages o the last row of results (browse view)
                paginationLinks = $("#searchResult").find("tr").last().find("a").last();
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

function onCrawlFinish(resultsFilePath) {
    return function (pool) {
        if (config.resultsFilePath) {
            fileUtils.appendFooterToFile(resultsFilePath);
        }
        console.log("Finished");
    }
}

/**
 *  This function creates a closure used to resolve the crawler promise once finished. The returned function returns
 *  the actual result (the list of torrents found)
*/
function onSearchFinish(config) {
    return function() {
        if (config.torrents) {
            return config.torrents;
        }
        console.log("Process finished");
    }
}

module.exports = tpbCrawler;
