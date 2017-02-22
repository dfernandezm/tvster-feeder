/**
 * Created by david on 21/02/2017.
 */
export interface DataExtractor {
    extractData(contentType: string, $: Function)
}