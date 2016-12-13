/**
 * Created by david on 11/12/2016.
 */
"use strict";
const fs = require("fs");
const FOOTER = ']}';
const HEADER = '{"torrents": [ \n';

const fileUtils = {};

fileUtils.appendFooterToFile = (filePath) => {
  fs.appendFile(filePath, FOOTER, function (err) {
    if (err) {
      console.log("Error appending " + err);
      return false;
    }
  });
}

fileUtils.appendHeaderToFile = (filePath) => {
  fs.appendFile(filePath, HEADER, function (err) {
    if (err) {
      console.log("Error appending " + err);
      return false;
    }
  });
}

fileUtils.appendObjectToFile = (object, filePath, visitedFilePath, crawledParts) => {
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
      console.log("Save crawledParts");
    })
  })
}

module.exports = fileUtils;