"use strict";
var Crawler = require("node-webcrawler");
var url = require('url');
var fs = require("fs");
var parseTorrent = require('parse-torrent');
var tpb = require("./tpb");
var _  = require("lodash");
var format = require('string-format');

// TV Shows
var baseUrl = "https://pirateproxy.vip";
var tvShowsUrl = baseUrl + "/browse/205";
var tvShowsHdUrl = baseUrl + "/browse/208";
var moviesUrl = baseUrl + "/browse/201";
var moviesHdUrl = baseUrl + "/browse/207";
var searchUrl = baseUrl + "/search/{}/0/3/0";
var torrents = [];
var crawledSections = [];
var count = 0;
var isLive = false;
var pagesOfResults = 3;
var pages = 0;

appendHeader();
var c = new Crawler({
    maxConnections : 8,
    rateLimits: 1000,
    // This will be called for each crawled page
    callback : function (error, result, $) {
          if (error) {
              console.log(error);
          } else {

            if (_.isFunction($)) {

              var torrentsRead = tpb.extractTorrentDataForSinglePage($);
              for (let torrent of torrentsRead) {
                parseTorrentLink(torrent, torrent.magnetLink, torrent.title, "");
              }

              if (!isLive || pages < pagesOfResults) {
                pages = pages + 1;
                let paginationLinks = $("#searchResult").find("tr").last().find("a");
                continueWithPagination(c, paginationLinks, $);
              }

            } else {
              console.log("$ is not a function -- terminating");
            }

         }
    },
    onDrain: function(pool) {
      process.nextTick(appendFooter);
      console.log("Finished. There are " + count + " links.");
    }
});

function parseTorrentLink(currentTorrent, torrentLink, episodeTitle, tvShowTitle) {
  parseTorrent.remote(torrentLink, function (err, parsedTorrent) {

    if (err) {
      console.log("Error parsing torrent: " + err);
      return false;
    }

    let size = (parsedTorrent.length) ? parseInt(parsedTorrent.length) : currentTorrent.size;
    let infoHash = parsedTorrent.infoHash;
    let name = parsedTorrent.name;

    //TODO: check if parsedTorrent.created is in the correct format
    let date = (parsedTorrent.created) ? parsedTorrent.created : currentTorrent.date;

    var torrent = {
      episodeTitle: episodeTitle,
      link: torrentLink,
      title: tvShowTitle,
      size: size,
      hash: infoHash,
      name: name,
      date: date,
      format: "",
      quality: "",
      audio: "",
      seeds: currentTorrent.seeds
    };
    count++;
    appendObject(torrent);
  });
}

function appendHeader() {
  var header = '{"torrents": [ \n';
  fs.appendFile('./torrents.json', header, function (err) {
      if (err) {
        console.log("Error appending " + err);
      }
  });
}

function appendObject(object) {
  let torrentJson = JSON.stringify(object);
  torrentJson = torrentJson + ", \n";
  fs.appendFile('./torrents.json', torrentJson, function (err) {
      if (err) {
        console.log("Error appending " + err);
      }
      console.log("Appended torrent");
      fs.writeFile("visited.json",  JSON.stringify(crawledSections), function(err) {
        if (err) {
          console.log("Error appending " + err);
        }
        console.log("Save visited pages");
      });
  });
}

function appendFooter() {
  var footer = ']}';
  fs.appendFile('./torrents.json', footer, function (err) {
      if (err) {
        console.log("Error appending " + err);
      }
  });
}

function continueWithPagination(crawler, selector, $) {
  $(selector).each(function(index, element) {
    var newPage = $(element).attr("href");
    if (crawledSections.indexOf(newPage) == -1 && (newPage.indexOf("browse/205") !== -1 || newPage.indexOf("browse/208") !== -1)) {
      crawledSections.push(newPage);
      let newUrl = baseUrl + newPage;
      console.log("New Url to visit: " + newUrl);
      crawler.queue(newUrl);
    }
  });
}

function liveSearch(searchQuery) {
  console.log("Doing live search...");
  isLive = true;
  let url = format(searchUrl, searchQuery);
  console.log(url);
  c.queue(url);
}

liveSearch("Suits");
// Queue just one URL, with default callback
//crawledSections.push(moviesUrl);
//c.queue([moviesUrl,moviesHdUrl]);
