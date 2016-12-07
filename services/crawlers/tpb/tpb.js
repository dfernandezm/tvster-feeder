"use strict";
var format = require('string-format');
var moment = require('moment');
var _ = require('lodash');

var recentTorrentsUrl = "https://ukpirate.org/recent/{}";
//var recentTorrentsUrl = "https://ukpirate.org/search/suits/0/99/{}";
//http://stackoverflow.com/questions/432493/how-do-you-access-the-matched-groups-in-a-javascript-regular-expression
var tpbGB = 'GiB';
var tpbMB = 'MiB';
var tpbToday = 'Today';
var tpbYesterday = 'Y-day';
var dateRegex = /Uploaded\s([^,]*).*/;

// 44 mins ago,
var almostNowRegex = /(\d+)(?:.*)(min).*ago/;
// Today 23:50 / Y-day 11:01
var recentTimeRegex = /day\s([^,]*).*$/;
// 08-07 2015 or 08-07 05:55
var fullDateRegex = /(\d+)\-(\d+)\s(?:(\d+$)|(\d+:\d+))/;
var sizeRegex = /Size\s(\d+\.\d+)\s(GiB|MiB)/;
var hashRegex = /urn:btih:(.*)&dn=/;

//var tpbConfig = require("./tpbConfig.json");

function parseDate(rawDateString) {

    let match = dateRegex.exec(rawDateString);

    let datePart = match[1];
    let now = moment();
    let date;

    match = almostNowRegex.exec(datePart);

    if (match !== null && match.length > 1) {
        console.log("Date --", match);
        var mins = parseInt(match[1]);
        var unit = parseInt(match[2]);

        if (_.startsWith(unit, 'min')) {
            now.subtract('minutes', mins);
        }
    } else {

        // Today 23:50 / Y-day 11:01
        match = recentTimeRegex.exec(datePart);

        if (match !== null && match.length > 1) {
            var time = match[1].split(':');
            var hours = parseInt(time[0]);
            var minutes = parseInt(time[1]);
            now.hours(hours);
            now.minutes(minutes);
            if (datePart.indexOf(tpbYesterday) > -1) {
                now.subtract('days', 1);
            }
        } else {
            // datePart is a full date in TPB format: 08-07 2015 or 08-07 05:55
            match = fullDateRegex.exec(datePart);
            console.log('date: ', datePart);
            if (match.length > 1) {
                // 1st group: day (regular case)
                // 2nd group: month (regular case)
                now.month(parseInt(match[1]) - 1);
                now.date(parseInt(match[2]));
                // 3rd capturing group either year or time
                var yearOrTime = match[3];

                // It is undefined when no year is present
                if (typeof yearOrTime == 'undefined') {
                    yearOrTime = match[4];
                }

                var yearOrTimeParts = yearOrTime.split(':');
                if (yearOrTimeParts.length == 1) {
                    // No ':' present, it is a year
                    now.year(parseInt(yearOrTimeParts[0]));
                    now.hours(0);
                    now.minutes(0);
                } else {
                    // Has :, it is a time
                    now.hours(parseInt(yearOrTimeParts[0]));
                    now.minutes(parseInt(yearOrTimeParts[1]));
                }
            }
        }
    }

    date = now.format('DD-MM-YYYY HH:mm');
    return date;
}

//  Size 233.78 MiB
function parseSize(rawDateAndSize) {
    var match = sizeRegex.exec(rawDateAndSize);
    if (match !== null && match.length > 1) {
        var rawNumber = match[1];
        var rawUnit = match[2];
        var number = parseFloat(rawNumber);

        // Simplification, size in MB as integer
        if (rawUnit === tpbGB) {
            number = number * 1024;
        }
        return Math.round(number);
    } else {
        console.log("Cannot parse size from " + rawDateAndSize);
        return 0;
    }
}

function getHashFromMagnet(magnetLink) {

    var match = hashRegex.exec(magnetLink);

    if (match !== null && match.length > 1) {
        var hash = match[1];
        return hash;
    } else {
        console.log("Cannot return hash from magnet: ", magnetLink);
    }

    return null;
}

var tpb = {};

tpb.extractTorrentDataForSinglePage = function ($) {

    var tableResult = $('#searchResult');
    var torrents = [];

    $('.vertTh', tableResult).each(function (index, element) {

        var tableElement = $(element).parent();
        var category = $('.vertTh a', tableElement).eq(0).text();
        var title = $('.detName a', tableElement).text();
        var magnet = $('td > a', tableElement).eq(0).attr('href');

        if (!_.startsWith(magnet, 'magnet:')) {
            console.log("It is not a magnet -- indirection to ", magnet);
            magnet = "https://ukpirate.org" + magnet;
        }

        var seeds = $('td', tableElement).eq(2).text();
        var rawDateAndSize = $('.detDesc', tableElement).eq(0).text();
        var hash = getHashFromMagnet(magnet);
        var date = '';
        var size = '';

        try {
            date = parseDate(rawDateAndSize);
            //var size = parseSize(rawDateAndSize);
        } catch (err) {
            console.log('Error parsing date ' + rawDateAndSize, err.message);
        }

        try {
            seeds = parseInt(seeds);
        } catch (err) {
            console.log('Error parsing seeds ' + seeds, err.message);
            seeds = '';
        }

        try {
            size = parseSize(rawDateAndSize);
        } catch (err) {
            console.log("Error parsing size " + size + " - " + rawDateAndSize);
        }

        var torrent = {
            category: category,
            title: title,
            magnetLink: magnet,
            seeds: seeds,
            date: date,
            size: size,
            hash: hash
        }
        torrents.push(torrent);
    });

    return torrents;
}

tpb.recentVideoTorrents = function (page) {
    //format, replace placeholder: var pagedRecentTorrents = format
    console.log('===> Getting recent video torrents from ThePirateBay <===');
    //var url = format(recentTorrentsUrl, page);
    //return crawlerUtils.attemptDataExtractionFromUrl(url, tpb.extractTorrentDataForSinglePage);
}

tpb.searchForMagnets = function (torrentList) {
//TODO:
}


module.exports = tpb;
