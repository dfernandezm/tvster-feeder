# TVster Feeder

Base of the search engine for TVster, crawls websites and feeds for torrent links to be stored in ElasticSearch.

## Logging

In order to debug to file using `debug` module:
```
DEBUG=* node crawler.js "Big Bang Theory" 2> /tmp/crawler.log
```

As `debug` module logs to `stderr` (descriptor `2>`).