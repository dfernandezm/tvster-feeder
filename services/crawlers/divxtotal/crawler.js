var Crawler = require("node-webcrawler");
var url = require('url');
var urlToVisit = "http://www.divxtotal.com/series";
var torrents = [];
var crawledSections = [];
var crawledLetters = [];
var count = 0;
var c = new Crawler({
    maxConnections : 10,
    rateLimits: 500,
    // This will be called for each crawled page
    callback : function (error, result, $) {
          if (error) {
              console.log(error);
          } else {

              console.log("Sections: " + crawledSections);
              var tvShowTitle = $("div.section_navtop h2").text();
              console.log("Title is " + tvShowTitle);  
              $("p.seccontnom a").each(function(index,a) {
                  var newUrl = $(a).attr("href");
                  console.log("Visiting TV Show: " + newUrl);
                  c.queue(newUrl);
              });

              $("table.fichserietabla tr.fichserietabla_a").each(function(index,a) {
                  var data = $("td.capitulonombre a",$(this));
                  console.log(data.text() + " - " + data.attr("href"));
                  torrents.push({
                    episode: data.text(),
                    link: data.attr("href")
                  });
                  // call indexer and store data in ElasticSearch
                  count++;
              });

              $("div.pagination a").each(function(index,a) {
                var newPage = $(a).attr("href");
                console.log("New Page: " + newPage);
                if (crawledSections.indexOf(newPage) == -1) {
                  crawledSections.push(newPage);
                  c.queue(newPage);
                }
              });
          }
    },
    onDrain: function(pool) {
      console.log("Finished. There are " + count + " links. The JSON is " + JSON.stringify(torrents));
    }
});

// Queue just one URL, with default callback
crawledSections.push(urlToVisit);
c.queue(urlToVisit);
