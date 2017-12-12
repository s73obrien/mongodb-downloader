/// <reference types="node" />
import { URL } from 'url';
import { RequestOptions } from 'http';
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
export declare class MongoDBDownload {
    options: IMongoDBDownloadOptions;
    mongoDBPlatform: MongoDBPlatform;
    downloadProgress: IMongoDBDownloadProgress;
    debug: any;
    constructor(options?: IMongoDBDownloadOptions);
    getPlatform(): string;
    getArch(): string;
    getVersion(): string;
    getDownloadDir(): string;
    getDownloadLocation(): Promise<string>;
    getExtractLocation(): Promise<string>;
    getTempDownloadLocation(): Promise<string>;
    downloadAndExtract(): Promise<string>;
    extract(): Promise<string>;
    download(): Promise<string>;
    isDownloadPresent(): Promise<void>;
    md5File(path: string): Promise<string>;
    isExtractPresent(): Promise<boolean>;
    getMD5HashFileLocation(): Promise<string>;
    cacheMD5Hash(signature: string): Promise<void>;
    getMD5Hash(): Promise<string>;
    getMD5HashOnline(): Promise<string>;
    getMD5HashOffline(): Promise<string>;
    httpDownload(httpOptions: RequestOptions, downloadLocation: string, tempDownloadLocation: string): Promise<string>;
    getCrReturn(): string;
    locationExists(location: string): boolean;
    printDownloadProgress(chunk: any): void;
    getHttpOptions(): Promise<RequestOptions>;
    getDownloadURI(): Promise<URL>;
    getDownloadURIMD5(): Promise<any>;
    createDownloadDir(): Promise<boolean>;
    getArchiveName(): Promise<string>;
}
export declare class MongoDBPlatform {
    platform: string;
    arch: string;
    debug: any;
    constructor(platform: string, arch: string);
    getPlatform(): string;
    getArch(): string;
    getArchiveType(): string;
    getCommonReleaseString(): string;
    getOSVersionString(): Promise<string>;
    getOtherOSVersionString(): Promise<string>;
    getLinuxOSVersionString(): Promise<string>;
    getDebianVersionString(os: any): string;
    getFedoraVersionString(os: any): string;
    getRhelVersionString(os: any): string;
    getElementaryOSVersionString(os: any): string;
    getSuseVersionString(os: any): string;
    getUbuntuVersionString(os: any): string;
    translatePlatform(platform: string): string;
    translateArch(arch: string, mongoPlatform: string): string;
}
