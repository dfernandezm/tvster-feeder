'use strict';
const debug = require("debug")("controllers:search");
const crawlerService = require("../services/crawlers/crawlerService");

function search(req, res) {
    let query = req.swagger.params.query.value;
    crawlerService.searchInTpb(query).then((torrents) => {
       debug("Torrents found %o",JSON.stringify(torrents));
        res.json({torrents: torrents});
    }).catch((err) => {
        debug("Error found: ", err)
    });
    
}


module.exports = {
    search: search
};
