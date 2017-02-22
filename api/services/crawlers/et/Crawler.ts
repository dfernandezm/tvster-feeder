/**
 * Created by david on 20/02/2017.
 */
'use strict';
export interface Crawler {
    crawlIndividualPage()
    crawlTvShows() : void
    crawlMovies() : void
    search(query: string)
}