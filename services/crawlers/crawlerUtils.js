"use strict";
let fs = require("fs");
const FOOTER = ']}';
const HEADER = '{"torrents": [ \n';
const crawlerUtils = {};

crawlerUtils.appendFooterToFile = (filePath) => {
  fs.appendFile(filePath, FOOTER, function (err) {
    if (err) {
      console.log("Error appending " + err);
      return false;
    }
  });
}

crawlerUtils.appendHeaderToFile = (filePath) => {
  fs.appendFile(filePath, HEADER, function (err) {
    if (err) {
      console.log("Error appending " + err);
      return false;
    }
  });
}

crawlerUtils.appendObjectToFile = (object, filePath, visitedFilePath, crawledParts) => {
  let torrentJson = JSON.stringify(object);
  torrentJson = torrentJson + ", \n";

  fs.appendFile(filePath, torrentJson, function (err) {
    if (err) {
      console.log("Error appending " + err);
      return false;
    }
    
    fs.writeFile(visitedFilePath,  JSON.stringify(crawledParts), { flag : 'w' }, function(err) {
      if (err) {
        console.log("Error appending " + err);
        return false;
      }
      console.log("Save visited pages");
    })
  })
}

module.exports = crawlerUtils;
