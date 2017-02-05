/**
 * Created by david on 05/02/2017.
 */

const debug = require("debug")("services/indexer:indexer");
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client();

const indexTorrent = (torrent) => {
    return new Promise((resolve, reject) => {
        client.index({
            index: 'torrents-today',
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

const search = (query) => {
    return new Promise((resolve, reject) => {
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



