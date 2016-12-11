"use strict";
const tpb = require("./tpbDataExtractor");
const format = require('string-format');
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils");
const config = require("./tpbConfig.json");

const tpbCrawler = {};

var crawledParts = [];

tpbCrawler.crawlTvShows = () => {

    let tvShowsUrl = config.baseUrl + config.tvShowsUrl;
    let tvShowsHdUrl = config.baseUrl + config.tvShowsHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [tvShowsUrl, tvShowsHdUrl];
    config.contentType = "TV_SHOW";
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, crawlFinish(config.resultsFilePath));
}

tpbCrawler.crawlMovies = () => {

    let moviesUrl = config.baseUrl + config.moviesUrl;
    let moviesHdUrl = config.baseUrl + config.moviesHdUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [moviesUrl, moviesHdUrl];
    config.contentType = "MOVIE";
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, crawlFinish(config.resultsFilePath));
}

function crawlIndividualPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        var torrentsRead = tpb.extractTorrentDataForSinglePage($);
        for (let torrent of torrentsRead) {
            torrent.contentType = config.contentType;
            torrentUtils.parseTorrentLink(config, torrent, torrent.magnetLink, crawledParts, true);
        }

        let paginationLinks = $("#searchResult").find("tr").last().find("a");

        //noinspection JSUnresolvedVariable
        continueWithPagination(config.baseUrl, crawler, paginationLinks, $);
    }
}

function continueWithPagination(baseUrl, crawler, paginationSelector, $) {
    $(paginationSelector).each(function (index, element) {
        var newPage = $(element).attr("href");
        if (crawledParts.indexOf(newPage) == -1) {
            crawledParts.push(newPage);
            let newUrl = baseUrl + newPage;
            console.log("New Url to visit: " + newUrl);
            crawler.queue(newUrl);
        }
    });
}

function crawlFinish(resultsFilePath) {
    return function (pool) {
        fileUtils.appendFooterToFile(resultsFilePath);
        console.log("Finished");
    }
}

module.exports = tpbCrawler;