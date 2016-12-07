'use strict';
var Crawler = require("node-webcrawler");
var url = require('url');
var fs = require("fs");
var parseTorrent = require('parse-torrent');

var urlToVisit = "http://www.divxtotal.com/series";
var torrents = [];
var torrentHashes = [];
var crawledSections = [];
var crawledLetters = [];
var count = 0;
var errors = 0;

appendHeader();
var c = new Crawler({
    maxConnections : 8,
    rateLimits: 1000,
    // This will be called for each crawled page
    callback : function (error, result, $) {
          if (error) {
              console.log(error);
          } else {

              console.log("Sections: " + crawledSections.length);
              var tvShowTitle = $("div.section_navtop h2").text();
              //TODO: trim the tvShowTitle and eliminate special chars (\t)
              $("p.seccontnom a").each(function(index,a) {
                  var newUrl = $(a).attr("href");
                  c.queue(newUrl);
              });

              $("table.fichserietabla tr.fichserietabla_a").each(function(index,a) {
                  var data = $("td.capitulonombre a",$(this));
                  let link = data.attr("href");
                  let episodeTitle = data.text();
                  console.log(tvShowTitle + " - " + episodeTitle + " - " + link);
                  parseTorrentLink(link, episodeTitle, tvShowTitle);
                  // call indexer and store data in ElasticSearch
                  count++;
              });

              // $("div.pagination a").each(function(index,a) {
              //   var newPage = $(a).attr("href");
              //   console.log("New Page: " + newPage);
              //   if (crawledSections.indexOf(newPage) == -1) {
              //     crawledSections.push(newPage);
              //     c.queue(newPage);
              //   }
              // });
          }
    },
    onDrain: function(pool) {
      process.nextTick(appendFooter);
      console.log("Finished. There are " + count + " links.");
    }
});


// =========== Movies =========================================================

var moviesUrl = "http://www.divxtotal.com/peliculas/";
var countMovies = 0;
var moviesCrawler = new Crawler({
    maxConnections : 8,
    rateLimits: 1000,
    // This will be called for each crawled page
    callback : function (error, result, $) {
          if (error) {
              console.log(error);
          } else {

            var movieTitleOut = "";
            var orderedMatcher = $("div.orden_alfa");

            if (orderedMatcher.length > 0) {

              $("li.section_item").each(function(index, elem) {
                  var movieDetailsLink = $("p.seccontnom a",$(elem));
                  var newUrl = movieDetailsLink.attr("href");
                  var movieTitle = movieDetailsLink.text();
                  console.log("Movie: " + movieTitle);
                  moviesCrawler.queue(newUrl);
              });

              $("li.section_item2").each(function(index, elem) {
                  var movieDetailsLink = $("p.seccontnom a",$(elem));
                  var newUrl = movieDetailsLink.attr("href");
                  var movieTitle = movieDetailsLink.text();
                  console.log("Movie: " + movieTitle);
                  moviesCrawler.queue(newUrl);
              });

            }

            // Info and link
            $("div.box_content div.ficha_content").each(function(index, elem) {
              // Info
              var context = $(elem);
              var info = $("div.ficha_list_det ul li", context);
              var quality = "";
              var format = "";
              var date = "";
              var size = "";
              var language = "";
              info.each(function(index2, elem2) {
                // Check existence
                var elems = $("p", $(elem2));
                var desc = elems.eq(0);
                var value = elems.eq(1);

                var descText = desc.text();
                var valueText = value.text();
                if (descText.indexOf("Calidad") !== -1) {
                  quality = valueText;
                }

                if (descText.indexOf("Formato") !== -1) {
                  format = valueText;
                }

                if (descText.indexOf("Fecha") !== -1) {
                  date = valueText;
                }

                if (descText.indexOf("Tama") !== -1) {
                  size = valueText;
                }

                if (descText.indexOf("Idioma") !== -1) {
                  language = valueText;
                }
              });

              var torrentLinkElem = $("div.ficha_link_det h3 a", context);
              var torrentLink = torrentLinkElem.attr("href");
              //console.log("Info: " + quality + " / " + format + " / " + date + " / " + size + " / " + language + " --> " + torrentLink);
              parseMovieLink(torrentLink, quality, format);
            });

            continueWithPagination(moviesCrawler, "div.pagination a", $);
          }
    },
    onDrain: function(pool) {
      process.nextTick(appendFooter);
      console.log("Finished. There are " + countMovies + " links.");
    }
});


function parseTorrentLink(torrentLink, episodeTitle, tvShowTitle) {
  parseTorrent.remote(torrentLink, function (err, parsedTorrent) {
    if (err) {
      console.log("Error parsing torrent: " + err);
      return false;
    }

    var size = parseInt(parsedTorrent.length);
    var infoHash = parsedTorrent.infoHash;
    var name = parsedTorrent.name;
    console.log("Size: " + size + " MB");
    console.log("InfoHash: " + infoHash);
    console.log("Name: " + name);

    var torrent = {
      episodeTitle: episodeTitle,
      link: torrentLink,
      tvShowTitle: tvShowTitle,
      size: size,
      hash: infoHash,
      name: name
    };
    appendObject(torrent);
  });
}

function parseMovieLink(torrentLink, quality, format) {
  parseTorrent.remote(torrentLink, function (err, parsedTorrent) {
    if (err) {
      console.log("Error parsing torrent: " + err + ": " + torrentLink);
      if (torrentLink) {
        var torrent = {
          link: torrentLink,
          language: "es",
          quality: quality,
          format: format
        };
        appendObject(torrent);
      }
      return false;
    }

    var size = parseInt(parsedTorrent.length/1024/1024);
    var infoHash = parsedTorrent.infoHash;
    var name = parsedTorrent.name;
    var date = parsedTorrent.created;

    if (torrentHashes.indexOf(infoHash) == -1) {
      console.log("Size: " + size + " MB");
      console.log("InfoHash: " + infoHash);
      console.log("Name: " + name);
      console.log("Date: " + date);

      var torrent = {
        link: torrentLink,
        size: size,
        hash: infoHash,
        name: name,
        date: date,
        language: "es",
        quality: quality,
        format: format
      };
      torrentHashes.push(infoHash);
      countMovies++;
      appendObject(torrent);
    }
    console.log("Number of movies: " + countMovies);
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

function appendFooter() {
  var footer = ']}';
  fs.appendFile('./torrents.json', footer, function (err) {
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
  });
}

function continueWithPagination(crawler, selector, $) {
  $(selector).each(function(index, element) {
    var newPage = $(element).attr("href");
    if (crawledSections.indexOf(newPage) == -1) {
      crawledSections.push(newPage);
      console.log("New Page: " + newPage);
      crawler.queue(newPage);
    }
  });
}

// Queue just one URL, with default callback
// crawledSections.push(tvShowsUrl);
// c.queue(tvShowsUrl);
crawledSections.push(moviesUrl);
moviesCrawler.queue(moviesUrl);
