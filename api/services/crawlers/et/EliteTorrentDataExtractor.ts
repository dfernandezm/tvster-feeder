/**
 * Created by david on 21/02/2017.
 */
import debug from "debug";
import {DataExtractor} from "./DataExtractor";

export class EliteTorrentDataExtractor implements DataExtractor {
    private logger = debug(EliteTorrentDataExtractor.name);

    extractData(contentType: string, $: Function) {
        this.logger("ExtractData" + contentType + $("aaa"));
    }
}