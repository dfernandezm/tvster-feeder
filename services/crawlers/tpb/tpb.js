"use strict";
const format = require('string-format');
const moment = require('moment');
const _ = require('lodash');

const tpbGB = 'GiB';
const tpbYesterday = 'Y-day';
const dateRegex = /Uploaded\s([^,]*).*/;

// 44 mins ago,
const almostNowRegex = /(\d+)(?:.*)(min).*ago/;

// Today 23:50 / Y-day 11:01
const recentTimeRegex = /day\s([^,]*).*$/;

// 08-07 2015 or 08-07 05:55
const fullDateRegex = /(\d+)\-(\d+)\s(?:(\d+$)|(\d+:\d+))/;
const sizeRegex = /Size\s(\d+\.\d+)\s(GiB|MiB)/;
const hashRegex = /urn:btih:(.*)&dn=/;

const tpb = {};

tpb.extractTorrentDataForSinglePage = function ($) {

    var tableResult = $('#searchResult');
    var torrents = [];

    $('.vertTh', tableResult).each(function (index, element) {
      
        let tableElement = $(element).parent();
        let category = $('.vertTh a', tableElement).eq(0).text();
        let title = $('.detName a', tableElement).text();
        let magnet = readMagnet(tableElement, $);
        let rawSeeds = $('td', tableElement).eq(2).text();
        let rawDateAndSize = $('.detDesc', tableElement).eq(0).text();
        let hash = getHashFromMagnet(magnet);
        let date = readDate(rawDateAndSize);
        let size = readSize(rawDateAndSize);
        let seeds = readSeeds(rawSeeds);

        let torrent = {
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

function readMagnet(tableElement, $) {
  var magnet = $('td > a', tableElement).eq(0).attr('href');
  if (!_.startsWith(magnet, 'magnet:')) {
    console.log("It is not a magnet -- indirection to ", magnet);
    return "";
  } else {
    return magnet;
  }
}

function readDate(rawDateAndSize) {
  try {
    return parseDate(rawDateAndSize);
  } catch (err) {
    console.log('Error parsing date ' + rawDateAndSize, err.message);
    return "";
  }
}

function readSize(rawDateAndSize) {
  try {
    return parseSize(rawDateAndSize);
  } catch (err) {
    console.log("Error parsing size from " + rawDateAndSize, err.message);
    return "";
  }
}

function readSeeds(rawSeeds) {
  try {
    return parseInt(rawSeeds);
  } catch (err) {
    console.log('Error parsing seeds ' + rawSeeds, err.message);
    return "";
  }
}

function parseDate(rawDateString) {

  let match = dateRegex.exec(rawDateString);
  
  let datePart = match[1];
  let now = moment();
  let date;

  match = almostNowRegex.exec(datePart);
  if (matches(match)) {
    var mins = parseInt(match[1]);
    var unit = parseInt(match[2]);

    if (_.startsWith(unit, 'min')) {
      now.subtract('minutes', mins);
    }
  } else {
    // Today 23:50 / Y-day 11:01
    match = recentTimeRegex.exec(datePart);

    if (matches(match)) {
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
      if (matches(match)) {
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
  if (matches(match)) {
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
  if (matches(match)) {
    return match[1];
  } else {
    console.log("Cannot return hash from magnet: ", magnetLink);
  }
  return null;
}

function matches(arrayMatcher) {
  return arrayMatcher !== null && arrayMatcher.length > 1;
}

module.exports = tpb;
