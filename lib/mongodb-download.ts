import {
  URL
} from 'url';

import { MongoDBArchive } from './mongodb-archive';

import {
  tmpdir
} from 'os';

import {
  IncomingMessage
} from 'http';

import {
  get
} from 'request-promise-native';

import {
  createWriteStream, WriteStream
} from 'fs';

import {
  join
} from 'path';

const prettysize = require('prettysize');

import * as ProgressBar from 'progress';

export default class MongoDBDownload {
  public archive: MongoDBArchive = new MongoDBArchive();
  private archiveHost: string = 'fastdl.mongodb.org';

  public async install(): Promise<WriteStream> {
    return get({ url: this.downloadURL, gzip: true })
      .on('error', er => {
        throw er;
      })
      .on('response', response => {
        let progress = new ProgressBar(
          '|:bar| :percent | ETA: :etas |', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: parseInt(response.headers['content-length'], 10)
          })
        progress.interrupt('Downloading ' + this.archive.name);

        response.on('data', data => {
          progress.tick(data.length);
        })
      })
      .on('complete', (response) => {
        get({ url: this.downloadURL + '.md5', gzip: true }).then(sig => {
          this.archive.verify(sig.split(' ')[0]).then(valid => {
            if (valid) {
              return this.archive.extract();
            }
          })
        });
      })
      .pipe(createWriteStream(this.archive.downloadPath))
  }

  public get downloadURL(): URL {
    return new URL(
      'http://' +
      this.archiveHost +
      '/' +
      this.archive.translatedPlatform +
      '/' +
      this.archive.name);
  }
}
