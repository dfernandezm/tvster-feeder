/**
 * Created by david on 11/12/2016.
 */
"use strict"

const divxTotalDataExtractor = {};


divxTotalDataExtractor.extractData = ($) => {
    attemptTvShowDataExtraction($);
    attemptMovieDataExtraction($);
}

function attemptTvShowDataExtraction($) {
    
    let tvShowTitle = $("div.section_navtop h2").text();
    let torrents = [];

    $("table.fichserietabla tr.fichserietabla_a").each(function (index, a) {
        var data = $("td.capitulonombre a", $(this));
        let link = data.attr("href");
        let episodeTitle = data.text();

        let currentTorrent = {
            contentType: config.contentType,
            tvShowTitle: (tvShowTitle) ? tvShowTitle : "",
            title: episodeTitle,
            torrentLink: link,
            language: "es"
        }

        torrents.push(currentTorrent);
    });
}


function attemptMovieDataExtraction($) {

    let torrents = [];
    
    $("div.box_content div.ficha_content").each(function(index, elem) {
        
        // Info
        var context = $(elem);
        var info = $("div.ficha_list_det ul li", context);
        
        var quality = "";
        var format = "";
        var date = "";
        var size = 0;
        
        info.each(function(index2, elem2) {
            
            let elems = $("p", $(elem2));
            
            if (elems.length > 0) {
                let desc = elems.eq(0);
                let value = elems.eq(1);

                let descText = desc.text();
                let valueText = value.text();

                if (descText.indexOf("Calidad") !== -1) {
                    quality = valueText;
                }

                if (descText.indexOf("Formato") !== -1) {
                    format = valueText;
                }

                if (descText.indexOf("Fecha") !== -1) {
                    //TODO: parse with moment()
                    date = valueText;
                }

                if (descText.indexOf("Tama") !== -1) {
                    //TODO: Parse to get number
                    size = valueText;
                }
            }
        });

        var torrentLinkElem = $("div.ficha_link_det h3 a", context);
        var torrentLink = torrentLinkElem.attr("href");

        let currentTorrent = {
            contentType: "MOVIE",
            torrentLink: torrentLink,
            format: format,
            quality: quality,
            language: "es"
        }
        
        torrents.push(currentTorrent);
    });

}

module.exports = divxTotalDataExtractor;
