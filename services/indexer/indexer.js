/**
 * Created by david on 05/02/2017.
 */

const debug = require("debug")("services/indexer:indexer");
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client();

const indexTorrent = (torrent, websiteId) => {
    return new Promise((resolve, reject) => {
        client.index({
            index: 'torrents-' + websiteId,
            type: 'torrent',
            id: torrent.hash,
            body: torrent
        }, (error, response) => {
            if (error) {
                return reject(error);
            } 
            debug("Response after creating torrent: ", response);
            return resolve(response);
        });      
    });
};
/*
Possible query

 GET /_search
 {
 "query": {
 "simple_query_string" : {
 "query": "\"fried eggs\" +(eggplant | potato) -frittata",
 "analyzer": "snowball",
 "fields": ["body^5","_all"],
 "default_operator": "and"
 }
 }
 }

 https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html
 */
const search = (query) => {
    return new Promise((resolve, reject) => {
        // ?q=season:10%20AND%20episode:14%20AND%20quality:HDTV%20AND%20name:(NOT%20x265)
        client.search({
            index: 'torrents-today',
            type: 'torrent',
            q: 'name:' + "*"+query+"*"
        }, (error, response) => {
            if (error) {
                reject(error);
            }
            debug("Response of search: ", response);
            resolve(response);
        });     
    });
};

module.exports = {
    indexTorrent: indexTorrent,
    search: search
};



