import debug from "debug";
import {Crawler} from "./Crawler"

class EliteTorrentCrawler implements Crawler {

    private logger = debug(EliteTorrentCrawler.name);
    
    crawlIndividualPage() {
        this.logger("Something");
    }

    crawlTvShows():void {
    }

    crawlMovies():void {
    }

    search(query:string) {
    }
}

export { EliteTorrentCrawler };