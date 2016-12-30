/**
 * Created by david on 11/12/2016.
 */
"use strict"
const Promise = require("bluebird");
const _ = require("lodash");
const divxTotalDataExtractor = require("./divxTotalDataExtractor");
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils");
const urlencode = require('urlencode');
const format = require('string-format');
const config = require("./divxTotalConfig.json");

const divxTotalCrawler = {}

var crawledParts = [];

divxTotalCrawler.crawlTvShows = () => {

    let tvShowsUrl = config.baseUrl + config.tvShowsUrl;
    
    let crawlConfig = {};
    crawlConfig.urls = [tvShowsUrl];
    crawlConfig.contentType = "TV_SHOW";
    let currentConfig = _.extend(config, crawlConfig);
    crawlerUtils.crawlWebsite(currentConfig, crawlIndividualPage, onCrawlFinish(config.resultsFilePath));
}

divxTotalCrawler.crawlMovies = () => {
    let moviesUrl = config.baseUrl + config.moviesUrl;

    let crawlConfig = {};
    crawlConfig.urls = [moviesUrl];
    crawlConfig.contentType = "MOVIE";
    let currentConfig = _.extend(config, crawlConfig);
    crawlerUtils.crawlWebsite(currentConfig, crawlIndividualPage, onCrawlFinish(config.resultsFilePath));
}

divxTotalCrawler.search = (query) => {
    let urlEncodedQuery = urlencode(query, "utf8");
    
    let searchPathWithQuery =  config.searchGeneralPath.format(urlEncodedQuery);
    let searchUrl = config.baseUrl + searchPathWithQuery;

    let searchConfig = {};
    searchConfig.urls = [searchUrl];
    searchConfig.crawlType = "SEARCH";
    searchConfig.limitPages = 1;
    searchConfig.navigatedResult = false;
    searchConfig.torrents = [];

    // Promises to wait for, in case the onDrain callback gets invoked earlier
    // than the processing finishes
    searchConfig.searchPromises = [];

    // Augment config with custom config for searching
    let currentConfig = _.extend(config, searchConfig)
    crawledParts.push(searchUrl);

    return new Promise(function(resolve, reject) {
        return crawlerUtils.crawlWebsitePromise(currentConfig, crawlIndividualSearchPage, onSearchFinish(currentConfig)).then(function(torrents) {
            console.log("Resolved promise for crawler, will return search results");
            return resolve(torrents);
        });
    });
}

// --- For live searching
function crawlIndividualSearchPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        config.contentType = "UNKNOWN";

        // When searching in DivxTotal, we only pick first result of the first list, then we visit
        // its link and get all the results in the resulting page:
        // query -> list results -> 1st result -> all data in the page extracted
        if (!config.navigatedResult) {
            navigateTvShowsLinksIfNecessary(crawler, true, $);
            config.navigatedResult = true;
        } else {
            extractDataIfPossible(config, $);
        }
    } else {
        console.log("Error connecting: " + result.statusCode);
    }
}

// -- For crawling
function crawlIndividualPage(config, crawler, result, $) {

    if (result.statusCode === 200) {

        if (config.contentType === "TV_SHOW") {
            navigateTvShowsLinksIfNecessary(crawler, false, $);
        } else { // "MOVIE"
            navigateMovieLinksIfNecessary(crawler, $);
        }

        extractDataIfPossible(config, $);


        // Get the last link of the pager -- it is the nextPage link (search results view)
        let paginationLink = $("div.pagination a").last().prev();

        //let paginationLinks = $("div.pagination a");

        //noinspection JSUnresolvedVariable
        continueWithPagination(config.baseUrl, crawler, paginationLink, $);

    } else {
        console.log("Error connecting: " + result.statusCode);
    }
}

/**
 * Extract data from a given crawled page. Also, parse any torrent links found to get extra data.
 * Depending on whether crawling or live searching, the process is handled differently:
 *
 * - when crawling: torrents read in promise without specific control
 * - when searching: torrents read in promises that are collected to await on
 *
 * @param config
 * @param $
 */
function extractDataIfPossible(config, $) {
    let isSearch = config.crawlType === "SEARCH";
    let torrentsRead = divxTotalDataExtractor.extractData(config.contentType, $);
    if (torrentsRead.length > 0) {
        // Each torrent is visited to get info, create promise with whole set and save it
        let torrentPromise = Promise.map(torrentsRead, function(torrentRead) {
            // Promise.map awaits for returned promises as well.
            console.log(JSON.stringify(torrentRead));
            return torrentUtils.parseTorrentLink(config, torrentRead, torrentRead.torrentLink, crawledParts, !isSearch);
        }).each(function(torrent) {
            console.log("Read torrent: " + torrent.name);
            if (config.torrents) {
                config.torrents.push(torrent);
            }
        }).then(function() {
            console.log("All torrents read");
        });

        if (isSearch) {
            // When searching, save promise so that we make onDrain callback wait for them to resolve before returning
            config.searchPromises.push(torrentPromise);
        }
    }
}

function continueWithPagination(baseUrl, crawler, paginationSelector, $) {
    $(paginationSelector).each(function (index, element) {
        var newPage = $(element).attr("href");
        if (crawledParts.indexOf(newPage) === -1) {
            crawledParts.push(newPage);
            let newUrl = newPage;
            console.log("New Url to visit: " + newUrl);
            crawler.queue(newUrl);
        }
    });
}

function navigateTvShowsLinksIfNecessary(crawler, onlyFirst, $) {
    if (onlyFirst) {
        // only first link
        let newUrl = $("p.seccontnom a").eq(0).attr("href");
        crawler.queue(newUrl);
    } else {
        $("p.seccontnom a").each(function(index, a) {
            let newUrl = $(a).attr("href");
            crawler.queue(newUrl);
        });
    }
}

function navigateMovieLinksIfNecessary(crawler, $) {
    let orderedMatcher = $("div.orden_alfa");
    if (orderedMatcher.length > 0) {
        $("li.section_item").each(function (index, elem) {
            navigateMovieLink(crawler, elem, $);
        });

        $("li.section_item2").each(function(index, elem) {
            navigateMovieLink(crawler, elem, $);
        });
    }
}

function navigateMovieLink(crawler, domElement, $) {
    var movieDetailsLink = $("p.seccontnom a", $(domElement));
    var newUrl = movieDetailsLink.attr("href");
    var movieTitle = movieDetailsLink.text();
    console.log("Movie Section: " + movieTitle);
    crawler.queue(newUrl);
}

function onCrawlFinish(resultsFilePath) {
    return function (pool) {
        fileUtils.appendFooterToFile(resultsFilePath);
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
            console.log("The torrents: " + config.torrents);
            return config.torrents;
        }
    }
}

module.exports = divxTotalCrawler;
