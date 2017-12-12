import {
  URL
} from 'url';

import {
  tmpdir,
  platform,
  arch
} from 'os';

import {
  get,
  RequestOptions,
  IncomingMessage
} from 'http';


import {
  writeFileSync,
  createReadStream,
  createWriteStream,
  readFileSync,
  renameSync
} from 'fs';

import {
  createHash
} from 'crypto';

const path: any = require('path');
const Debug: any = require('debug');
const getos: any = require('getos');
const decompress: any = require('decompress');
const request: any = require('request-promise');
const md5File: any = require('md5-file');

const DOWNLOAD_URI: string = "https://fastdl.mongodb.org";
const MONGODB_VERSION: string = "latest";

export interface IMongoDBDownloadOptions {
  platform: string;
  arch: string;
  version: string;
  downloadDir: string;
  url: URL;
}

export interface IMongoDBDownloadProgress {
  current: number;
  length: number;
  total: number;
  lastStdout: string;
}


export class MongoDBDownload {
  options: IMongoDBDownloadOptions;
  mongoDBPlatform: MongoDBPlatform;
  downloadProgress: IMongoDBDownloadProgress;
  debug: any;

  constructor(
    options: IMongoDBDownloadOptions = {
      platform: platform(),
      arch: arch(),
      downloadDir: tmpdir(),
      version: MONGODB_VERSION,
      url: null
    }
  ) {
    this.options = options;
    this.options.downloadDir = path.resolve(this.options.downloadDir, 'mongodb-download');

    this.debug = Debug('mongodb-download-MongoDBDownload');

    this.mongoDBPlatform = new MongoDBPlatform(this.getPlatform(), this.getArch());

    this.downloadProgress = {
      current: 0,
      length: 0,
      total: 0,
      lastStdout: ""
    }
  }

  getPlatform(): string {
    return this.options.platform;
  }

  getArch(): string {
    return this.options.arch;
  }

  getVersion(): string {
    return this.options.version;
  }

  getDownloadDir(): string {
    return this.options.downloadDir;
  }

  async getDownloadLocation(): Promise<string> {
    return path.resolve(this.getDownloadDir, this.getArchiveName);
  }

  async getExtractLocation(): Promise<string> {
    let hash = await this.getMD5Hash();
    let downloadDir: string = this.getDownloadDir();
    let extractLocation: string = path.resolve(downloadDir, hash);
    this.debug(`getExtractLocation(): ${extractLocation}`);
    return extractLocation;
  }

  async getTempDownloadLocation(): Promise<string> {
    return await this.getDownloadLocation() + '.downloading';
  }

  async downloadAndExtract(): Promise<string> {
    await this.download();
    return this.extract();
  }

  async extract(): Promise<string> {
    let extractionLocation = await this.getExtractLocation();
    if (await this.isExtractPresent()) {
      return extractionLocation;
    }

    await decompress(
      await this.getDownloadLocation(),
      extractionLocation);

    return extractionLocation;
  }

  async download(): Promise<string> {
    const httpOptions = await this.getHttpOptions();
    const downloadLocation = await this.getDownloadLocation();
    const tempDownloadLocation = await this.getTempDownloadLocation();
    const createDownloadDir = await this.createDownloadDir();

    if (await this.isDownloadPresent()) {
      return downloadLocation;
    } else {
      return await this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation);
    }
  }


  async isDownloadPresent(): Promise<void> {
    let downloadLocation = await this.getDownloadLocation();
    if (this.locationExists(downloadLocation)) {
      let md5 = await this.getMD5Hash();
      if (await md5File(downloadLocation) !== md5) {
        throw ('MD5 signature does not match');
      }
    }
  }

  async md5File(path: string): Promise<string> {
    let stream = createReadStream(path);
    let buffer: Buffer;
    let wstream = createWriteStream(buffer);
    stream.pipe(createHash('md5')).pipe(wstream);
    return buffer.toString();
  }

  async isExtractPresent(): Promise<boolean> {
    return this.locationExists(await this.getExtractLocation());
  }

  async getMD5HashFileLocation(): Promise<string> {
    return await this.getDownloadLocation() + '.md5';
  }

  async cacheMD5Hash(signature: string): Promise<void> {
    return writeFileSync(await this.getMD5HashFileLocation(), signature);
  }

  async getMD5Hash(): Promise<string> {
    try {
      return await this.getMD5HashOffline();
    } catch (error) {
      return this.getMD5HashOnline();
    }
  }

  async getMD5HashOnline(): Promise<string> {
    let signatureContent = await request(await this.getDownloadURIMD5());
    let signatureMatch: string[] = signatureContent.match(/(.*?)\s/);
    let signature: string = signatureMatch[1];
    await this.cacheMD5Hash(signature);
    return signature;
  }

  async getMD5HashOffline(): Promise<string> {
    return readFileSync(await this.getMD5HashFileLocation(), 'utf8');
  }

  async httpDownload(httpOptions: RequestOptions, downloadLocation: string, tempDownloadLocation: string): Promise<string> {
    let fileStream = createWriteStream(tempDownloadLocation);

    let request = get(httpOptions, (response: IncomingMessage) => {
      this.downloadProgress.current = 0;
      this.downloadProgress.length = parseInt(response.headers['content-length'], 10);
      this.downloadProgress.total = Math.round(this.downloadProgress.length / 1048576 * 10) / 10;

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        renameSync(tempDownloadLocation, downloadLocation);
        return downloadLocation;
      });

      response.on("data", (chunk: any) => {
        this.printDownloadProgress(chunk);
      });

      request.on("error", (e: any) => {
        throw e;
      });
    });
  }

  getCrReturn(): string {
    if (this.mongoDBPlatform.getPlatform() === "win32") {
      return "\x1b[0G";
    } else {
      return "\r";
    }
  }

  locationExists(location: string): boolean {
    let exists: boolean;
    try {
      let stats: any = fs.lstatSync(location);
      this.debug("sending file from cache", location);
      exists = true;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      exists = false;
    }
    return exists;
  }

  printDownloadProgress(chunk: any): void {
    let crReturn: string = this.getCrReturn();
    this.downloadProgress.current += chunk.length;
    let percent_complete: number = Math.round(
      100.0 * this.downloadProgress.current / this.downloadProgress.length * 10
    ) / 10;
    let mb_complete: number = Math.round(this.downloadProgress.current / 1048576 * 10) / 10;
    let text_to_print: string =
      `Completed: ${percent_complete} % (${mb_complete}mb / ${this.downloadProgress.total}mb${crReturn}`;
    if (this.downloadProgress.lastStdout !== text_to_print) {
      this.downloadProgress.lastStdout = text_to_print;
      process.stdout.write(text_to_print);
    }
  }

  async getHttpOptions(): Promise<RequestOptions> {
    let url = await this.getDownloadURI();
    if (process.env.HTTP_PROXY) {
      let proxy = new URL(process.env.HTTP_PROXY);
      return {
        protocol: proxy.protocol,
        port: proxy.port,
        hostname: proxy.hostname,
        method: 'CONNECT',
        path: url.href
      }
    } else {
      return {
        protocol: url.protocol,
        port: url.port,
        hostname: url.hostname,
        path: url.pathname + url.search + url.hash
      }
    }
  }

  async getDownloadURI(): Promise<URL> {
    let url = DOWNLOAD_URI + '/' + this.mongoDBPlatform.getPlatform();
    url += '/' + await this.getArchiveName();
    return new URL(url);
  }

  getDownloadURIMD5(): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      this.getDownloadURI().then((downloadURI: any) => {
        let downloadURIMD5: string = `${downloadURI.href}.md5`;
        this.debug(`getDownloadURIMD5: ${downloadURIMD5}`);
        resolve(downloadURIMD5);
      })
    });
  }

  createDownloadDir(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let dirToCreate: string = this.getDownloadDir();
      this.debug(`createDownloadDir(): ${dirToCreate}`);
      fs.ensureDir(dirToCreate, (err: any) => {
        if (err) {
          this.debug(`createDownloadDir() error: ${err}`);
          throw err;
        } else {
          this.debug(`createDownloadDir(): true`);
          resolve(true);
        }
      });
    });
  }


  getArchiveName(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      //var name = "mongodb-" + mongo_platform + "-" + mongo_arch;
      let name = "mongodb-" +
        this.mongoDBPlatform.getPlatform() + "-" +
        this.mongoDBPlatform.getArch();

      this.mongoDBPlatform.getOSVersionString().then(osString => {
        osString && (name += `-${osString}`);
      }, (error) => {
        // nothing to add to name ... yet
      }).then(() => {
        name += `-${this.getVersion()}.${this.mongoDBPlatform.getArchiveType()}`;
        resolve(name);
      });
    });
  }
}


export class MongoDBPlatform {
  platform: string;
  arch: string;
  debug: any;

  constructor(platform: string, arch: string) {
    this.debug = Debug('mongodb-download-MongoDBPlatform');
    this.platform = this.translatePlatform(platform);
    this.arch = this.translateArch(arch, this.getPlatform());
  }

  getPlatform(): string {
    return this.platform;
  }

  getArch(): string {
    return this.arch;
  }

  getArchiveType(): string {
    if (this.getPlatform() === "win32") {
      return "zip";
    } else {
      return "tgz";
    }
  }

  getCommonReleaseString(): string {
    let name: string = `mongodb-${this.getPlatform()}-${this.getArch()}`;
    return name;
  }

  getOSVersionString(): Promise<string> {
    if (this.getPlatform() === "linux" && this.getArch() !== "i686") {
      return this.getLinuxOSVersionString();
    } else {
      return this.getOtherOSVersionString();
    }
  }

  getOtherOSVersionString(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      reject("");
    });
  }

  getLinuxOSVersionString(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      getos((e: any, os: any) => {
        if (/ubuntu/i.test(os.dist)) {
          resolve(this.getUbuntuVersionString(os));
        } else if (/elementary OS/i.test(os.dist)) {
          resolve(this.getElementaryOSVersionString(os));
        } else if (/suse/i.test(os.dist)) {
          resolve(this.getSuseVersionString(os));
        } else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
          resolve(this.getRhelVersionString(os));
        } else if (/fedora/i.test(os.dist)) {
          resolve(this.getFedoraVersionString(os));
        } else if (/debian/i.test(os.dist)) {
          resolve(this.getDebianVersionString(os));
        } else {
          reject("");
        }
      });
    });
  }

  getDebianVersionString(os: any): string {
    let name: string = "debian";
    let release: number = parseFloat(os.release);
    if (release >= 8.1) {
      name += "81";
    } else if (release >= 7.1) {
      name += "71";
    } else {
      this.debug("using legacy release");
    }
    return name;
  }

  getFedoraVersionString(os: any): string {
    let name: string = "rhel";
    let fedora_version: number = parseInt(os.release);
    if (fedora_version > 18) {
      name += "70";
    } else if (fedora_version < 19 && fedora_version >= 12) {
      name += "62";
    } else if (fedora_version < 12 && fedora_version >= 6) {
      name += "55";
    } else {
      this.debug("using legacy release");
    }
    return name;
  }

  getRhelVersionString(os: any): string {
    let name: string = "rhel";
    if (/^7/.test(os.release)) {
      name += "70";
    } else if (/^6/.test(os.release)) {
      name += "62";
    } else if (/^5/.test(os.release)) {
      name += "55";
    } else {
      this.debug("using legacy release");
    }
    return name;
  }

  getElementaryOSVersionString(os: any): string {
    let name: string = "ubuntu1404";
    return name;
  }

  getSuseVersionString(os: any): string {
    let [release]: [string | null] = os.release.match(/(^11|^12)/) || [null];

    if (release) {
      return `suse${release}`;
    } else {
      this.debug("using legacy release");
      return '';
    }
  }

  getUbuntuVersionString(os: any): string {
    let name: string = "ubuntu";
    let ubuntu_version: string[] = os.release ? os.release.split('.') : '';
    let major_version: number = parseInt(ubuntu_version[0]);
    let minor_version: string = ubuntu_version[1];

    if (os.release === "12.04") {
      name += "1204";
    } else if (os.release === "14.04") {
      name += "1404";
    } else if (os.release === "14.10") {
      name += "1410-clang";
    } else if (major_version === 14) {
      // default for major 14 to 1404
      name += "1404";
    } else if (os.release === "16.04") {
      name += "1604";
    } else if (major_version === 16) {
      // default for major 16 to 1604
      name += "1604";
    } else {
      // this needs to default to legacy release, this is a BUG
      this.debug("selecting default Ubuntu release 1404");
      name += "1404";
    }
    return name;
  }


  translatePlatform(platform: string): string {
    const platforms: { [key: string]: string } = {
      "darwin": "osx",
      "win32": "win32",
      "linux": "linux",
      "elementary OS": "linux", //os.platform() doesn't return linux for elementary OS.
      "sunos": "sunos5"
    }

    if (!platforms[platform]) {
      this.debug("unsupported platform %s by MongoDB", platform);
      throw new Error(`unsupported OS ${platform}`);
    }

    return platforms[platform];
  }

  translateArch(arch: string, mongoPlatform: string): string {
    if (arch === "ia32") {
      if (mongoPlatform === "linux") {
        return "i686";
      } else if (mongoPlatform === "win32") {
        return "i386";
      } else {
        this.debug("unsupported mongo platform and os combination");
        throw new Error("unsupported architecture");
      }
    } else if (arch === "x64") {
      return "x86_64";
    } else {
      this.debug("unsupported architecture");
      throw new Error("unsupported architecture, ia32 and x64 are the only valid options");
    }
  }

}
