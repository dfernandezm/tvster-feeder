/**
 * Created by david on 11/12/2016.
 */
const divxTotalDataExtractor = require("./divxTotalDataExtractor");
const torrentUtils = require("../torrentUtils");
const crawlerUtils = require("../crawlerUtils");
const fileUtils = require("../fileUtils")
const config = require("./divxTotalConfig.json");

const divxTotalCrawler = {}

var crawledParts = [];

divxTotalCrawler.crawlTvShows = () => {

    let tvShowsUrl = config.baseUrl + config.tvShowsUrl;

    //noinspection JSUnresolvedVariable
    config.urls = [tvShowsUrl];
    config.contentType = "TV_SHOW";
    crawlerUtils.crawlWebsite(config, crawlIndividualPage, crawlFinish(config.resultsFilePath));
}

function crawlIndividualPage(config, crawler, result, $) {
    if (result.statusCode === 200) {
        //TODO: separate in movies and tvShows sections as they are different
        navigateMovieLinksIfNecessary(crawler, $);

        navigateTvShowsLinksIfNecessary(crawler, $);

        var torrentsRead = divxTotalDataExtractor.extractData(config, $);
        for (let torrent of torrentsRead) {
            torrent.contentType = config.contentType;
            torrentUtils.parseTorrentLink(config, torrent, torrent.magnetLink, crawledParts, true);
        }

        let paginationLinks = $("div.pagination a");

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

function crawlFinish(resultsFilePath) {
    return function (pool) {
        fileUtils.appendFooterToFile(resultsFilePath);
        console.log("Finished");
    }
}

module.exports = divxTotalCrawler;