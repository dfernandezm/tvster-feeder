/**
 * Created by david on 09/12/2016.
 */
"use strict";
const parseTorrent = require('parse-torrent');
const crawlerUtils = require("./crawlerUtils");
const torrentUtils = {};

torrentUtils.parseTorrentLink = (currentTorrent, torrentLink, crawledParts, append) => {
  parseTorrent.remote(torrentLink, function (err, parsedTorrent) {
    if (err) {
      console.log("Error parsing torrent: " + err);
      return false;
    }

    let torrent = {};

    torrent.size = (parsedTorrent.length) ? parseInt(parsedTorrent.length) : currentTorrent.size;
    torrent.hash = parsedTorrent.infoHash;
    torrent.name = parsedTorrent.name;
    torrent.contentType = currentTorrent.contentType;

    if (currentTorrent.tvShowTitle) {
      torrent.title = currentTorrent.tvShowTitle;
    } else if (currentTorrent.movieTitle) {
      torrent.title = currentTorrent.movieTitle;
    } else {
      torrent.title = torrent.name;
    }

    //TODO: check if parsedTorrent.created is in the correct format
    torrent.date = (parsedTorrent.created) ? parsedTorrent.created : currentTorrent.date;
    torrent.format = (currentTorrent.format) ? currentTorrent.format : "";
    torrent.quality = (currentTorrent.quality) ? currentTorrent.quality : "";
    torrent.audio = (currentTorrent.audio) ? currentTorrent.audio : "";
    torrent.seeds =  (currentTorrent.seeds) ? currentTorrent.seeds : "";

    if (append) {
       crawlerUtils.appendObjectToFile(torrent, "/tmp/torrents.json", "/tmp/visited.json", crawledParts);   
    }
  });
}

module.exports = torrentUtils;
