/**
 * Created by david on 09/12/2016.
 */
"use strict";
const debug = require("debug")("services/crawlers:torrentUtils");
const _ = require("lodash");
const parseTorrent = require('parse-torrent');
const ptn = require('parse-torrent-name');
const fileUtils = require("./fileUtils");
const indexer = require("../indexer/indexer");
const torrentUtils = {};

torrentUtils.parseTorrentLink = (config, currentTorrent, torrentLink, crawledParts, append) => {

  return new Promise(function(resolve, reject) {
    parseTorrent.remote(torrentLink, async function (err, parsedTorrent) {

      if (err) {
        debug("Error parsing torrent: " + torrentLink + " - " + JSON.stringify(currentTorrent) + err);
        if (err.message.indexOf("Error downloading torrent") !== -1) {

          debug("Retrying in 3 seconds...");
          setTimeout(torrentUtils.parseTorrentLink(config, currentTorrent, torrentLink, crawledParts, append), 3000);
        } else if (err.message.indexOf("Torrent is missing required field")) {

          debug("Missing info for torrent " + JSON.stringify(parsedTorrent));

          // hack here -- we should reject, but this is part of a chain that we don't want to break due to errors, so
          // we resolve with special value (null) and handle that in success callback
          resolve(null);
        } else {
          resolve(null);
        }
      }

      if (parsedTorrent) {

        let torrent = {};

        if (_.startsWith(torrentLink, "magnet:")) {
          torrent.magnetLink = torrentLink;
        } else {
          torrent.torrentLink = torrentLink;
        }
        torrent.size = (parsedTorrent.length) ? parseInt(parsedTorrent.length) : currentTorrent.size;
        torrent.hash = parsedTorrent.infoHash;
        torrent.name = parsedTorrent.name;
        torrent.contentType = currentTorrent.contentType;

        let torrentInfo = ptn(torrent.name);

        debug("Parsed torrent name: " + torrent.name + " - " + JSON.stringify(torrentInfo));

        if (currentTorrent.tvShowTitle) {
          torrent.title = currentTorrent.tvShowTitle;
        } else if (currentTorrent.movieTitle) {
          torrent.title = currentTorrent.movieTitle;
        } else {
          torrent.title = torrentInfo.title;
        }

        //TODO: check if parsedTorrent.created is in the correct format
        torrent.date = (parsedTorrent.created) ? parsedTorrent.created : currentTorrent.date;
        torrent.format = (currentTorrent.format) ? currentTorrent.format : torrentInfo.codec;
        torrent.resolution = torrentInfo.resolution;
        torrent.quality = (currentTorrent.quality) ? currentTorrent.quality : torrentInfo.quality;
        torrent.audio = (currentTorrent.audio) ? currentTorrent.audio : torrentInfo.audio;
        torrent.seeds = (currentTorrent.seeds) ? currentTorrent.seeds : -1;
        torrent.season = (torrentInfo.season) ? torrentInfo.season : -1;
        torrent.episode = (torrentInfo.episode) ? torrentInfo.episode : -1;

        if (append) {
          //noinspection JSUnresolvedVariable
          // fileUtils.appendObjectToFile(torrent, config.resultsFilePath, config.visitedFilePath, crawledParts);
        } else {
          if (config.torrents) {
            config.torrents.push(torrent);
          }
        }
          debug("Indexing torrent: ", torrent.title);
          // index it in ElasticSearch
          //indexer.indexTorrent(torrent, config.website.toLowerCase());
          return resolve(torrent);
      }
    });
  });
};

module.exports = torrentUtils;
