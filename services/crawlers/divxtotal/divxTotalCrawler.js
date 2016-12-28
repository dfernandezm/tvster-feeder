/**
 * Created by david on 11/12/2016.
 */
"use strict"
const _ = require("lodash");
const divxTotalDataExtractor = require("./divxTotalDataExtractor");
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils")
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

function crawlIndividualPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        if (config.contentType === "TV_SHOW") {
            navigateTvShowsLinksIfNecessary(crawler, $);
        } else { // "MOVIE"
            navigateMovieLinksIfNecessary(crawler, $);
        }
        extractDataIfPossible(config, crawler, $);
    } else {
        console.log("Error connecting: " + result.statusCode);
    }
}

function extractDataIfPossible(config, crawler, $) {
    var torrentsRead = divxTotalDataExtractor.extractData(config.contentType, $);
    let i = 0;
    let pauseMs = 0;
    for (let torrent of torrentsRead) {

        if (i % 2 === 0) {
            pauseMs = 500;
        } else {
            pauseMs = 700;
        }

        setTimeout(() => {
            torrentUtils.parseTorrentLink(config, torrent, torrent.torrentLink, crawledParts, true);
        }, pauseMs);
    }

    let paginationLinks = $("div.pagination a");

    //noinspection JSUnresolvedVariable
    continueWithPagination(config.baseUrl, crawler, paginationLinks, $);
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

function navigateTvShowsLinksIfNecessary(crawler, $) {
    $("p.seccontnom a").each(function(index,a) {
        let newUrl = $(a).attr("href");
        crawler.queue(newUrl);
    });
}

function navigateMovieLinksIfNecessary(crawler, $) {
    let orderedMatcher = $("div.orden_alfa");
    if (orderedMatcher.length > 0) {
        $("li.section_item").each(function (index, elem) {
            navigateMovieLink(crawler, elem);
        });

        $("li.section_item2").each(function(index, elem) {
            navigateMovieLink(crawler, elem);
        });
    }
}

function navigateMovieLink(crawler, domElement, $) {
    var movieDetailsLink = $("p.seccontnom a",$(domElement));
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

module.exports = divxTotalCrawler;
