/**
 * Created by david on 09/12/2016.
 */
"use strict";
const parseTorrent = require('parse-torrent');
const ptn = require('parse-torrent-name');
const fileUtils = require("./fileUtils");
const torrentUtils = {};

torrentUtils.parseTorrentLink = (config, currentTorrent, torrentLink, crawledParts, append) => {
  parseTorrent.remote(torrentLink, function (err, parsedTorrent) {
    if (err) {
      console.log("Error parsing torrent: " + err);
      if (err.message.indexOf("Error downloading torrent") !== -1) {
        console.log("Retrying in 3 seconds...");
        setTimeout(torrentUtils.parseTorrentLink(config, currentTorrent, torrentLink, crawledParts, append), 3000);
      } else if (err.message.indexOf("Torrent is missing required field")) {
        console.log("Missing info for torrent " + JSON.stringify(parsedTorrent));
        return false;
      } else {
        return false;
      }
    }

    if (parsedTorrent) {
      let torrent = {};

      torrent.size = (parsedTorrent.length) ? parseInt(parsedTorrent.length) : currentTorrent.size;
      torrent.hash = parsedTorrent.infoHash;
      torrent.name = parsedTorrent.name;
      torrent.contentType = currentTorrent.contentType;

      let torrentInfo = ptn(torrent.name);

      console.log("Parsed torrent name: " + torrent.name + " - " + JSON.stringify(torrentInfo));

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
      torrent.seeds = (currentTorrent.seeds) ? currentTorrent.seeds : 0;
      torrent.season = (torrentInfo.season) ? torrentInfo.season : -1;
      torrent.episode = (torrentInfo.episode) ? torrentInfo.episode : -1;

      if (append) {
        //noinspection JSUnresolvedVariable
        fileUtils.appendObjectToFile(torrent, config.resultsFilePath, config.visitedFilePath, crawledParts);
      } else {
        if (config.torrents) {
          config.torrents.push(torrent);
        }
      }
    }
  });
}

module.exports = torrentUtils;

