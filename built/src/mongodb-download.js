"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const mongodb_archive_1 = require("./mongodb-archive");
const request_promise_native_1 = require("request-promise-native");
const fs_1 = require("fs");
const prettysize = require('prettysize');
const ProgressBar = require("progress");
class MongoDBDownload {
    constructor() {
        this.archive = new mongodb_archive_1.MongoDBArchive();
        this.archiveHost = 'fastdl.mongodb.org';
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            var progress;
            return request_promise_native_1.get({ url: this.downloadURL, gzip: true })
                .on('error', er => {
                throw er;
            })
                .on('response', response => {
                progress = new ProgressBar('|:bar| :percent | ETA: :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 40,
                    total: parseInt(response.headers['content-length'], 10)
                });
                progress.interrupt('Downloading ' + this.archive.name);
                response.on('data', data => {
                    progress.tick(data.length);
                });
            })
                .on('complete', (response) => {
                progress.interrupt('Verifying integrity of ' + this.archive.name);
                request_promise_native_1.get({ url: this.downloadURL + '.md5', gzip: true }).then(sig => {
                    this.archive.verify(sig.split(' ')[0]).then(valid => {
                        if (valid) {
                            return this.archive.extract();
                        }
                    });
                });
            })
                .pipe(fs_1.createWriteStream(this.archive.downloadPath));
        });
    }
    get downloadURL() {
        return new url_1.URL('http://' +
            this.archiveHost +
            '/' +
            this.archive.translatedPlatform +
            '/' +
            this.archive.name);
    }
}
exports.default = MongoDBDownload;
//# sourceMappingURL=mongodb-download.js.map