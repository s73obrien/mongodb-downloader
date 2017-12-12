"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var os_1 = require("os");
var http_1 = require("http");
var fs_1 = require("fs");
var crypto_1 = require("crypto");
var path = require('path');
var Debug = require('debug');
var getos = require('getos');
var decompress = require('decompress');
var request = require('request-promise');
var md5File = require('md5-file');
var DOWNLOAD_URI = "https://fastdl.mongodb.org";
var MONGODB_VERSION = "latest";
var MongoDBDownload = /** @class */ (function () {
    function MongoDBDownload(options) {
        if (options === void 0) { options = {
            platform: os_1.platform(),
            arch: os_1.arch(),
            downloadDir: os_1.tmpdir(),
            version: MONGODB_VERSION,
            url: null
        }; }
        this.options = options;
        this.options.downloadDir = path.resolve(this.options.downloadDir, 'mongodb-download');
        this.debug = Debug('mongodb-download-MongoDBDownload');
        this.mongoDBPlatform = new MongoDBPlatform(this.getPlatform(), this.getArch());
        this.downloadProgress = {
            current: 0,
            length: 0,
            total: 0,
            lastStdout: ""
        };
    }
    MongoDBDownload.prototype.getPlatform = function () {
        return this.options.platform;
    };
    MongoDBDownload.prototype.getArch = function () {
        return this.options.arch;
    };
    MongoDBDownload.prototype.getVersion = function () {
        return this.options.version;
    };
    MongoDBDownload.prototype.getDownloadDir = function () {
        return this.options.downloadDir;
    };
    MongoDBDownload.prototype.getDownloadLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, path.resolve(this.getDownloadDir, this.getArchiveName)];
            });
        });
    };
    MongoDBDownload.prototype.getExtractLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hash, downloadDir, extractLocation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMD5Hash()];
                    case 1:
                        hash = _a.sent();
                        downloadDir = this.getDownloadDir();
                        extractLocation = path.resolve(downloadDir, hash);
                        this.debug("getExtractLocation(): " + extractLocation);
                        return [2 /*return*/, extractLocation];
                }
            });
        });
    };
    MongoDBDownload.prototype.getTempDownloadLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadLocation()];
                    case 1: return [2 /*return*/, (_a.sent()) + '.downloading'];
                }
            });
        });
    };
    MongoDBDownload.prototype.downloadAndExtract = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.download()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.extract()];
                }
            });
        });
    };
    MongoDBDownload.prototype.extract = function () {
        return __awaiter(this, void 0, void 0, function () {
            var extractionLocation, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getExtractLocation()];
                    case 1:
                        extractionLocation = _b.sent();
                        return [4 /*yield*/, this.isExtractPresent()];
                    case 2:
                        if (_b.sent()) {
                            return [2 /*return*/, extractionLocation];
                        }
                        _a = decompress;
                        return [4 /*yield*/, this.getDownloadLocation()];
                    case 3: return [4 /*yield*/, _a.apply(void 0, [_b.sent(),
                            extractionLocation])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, extractionLocation];
                }
            });
        });
    };
    MongoDBDownload.prototype.download = function () {
        return __awaiter(this, void 0, void 0, function () {
            var httpOptions, downloadLocation, tempDownloadLocation, createDownloadDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getHttpOptions()];
                    case 1:
                        httpOptions = _a.sent();
                        return [4 /*yield*/, this.getDownloadLocation()];
                    case 2:
                        downloadLocation = _a.sent();
                        return [4 /*yield*/, this.getTempDownloadLocation()];
                    case 3:
                        tempDownloadLocation = _a.sent();
                        return [4 /*yield*/, this.createDownloadDir()];
                    case 4:
                        createDownloadDir = _a.sent();
                        return [4 /*yield*/, this.isDownloadPresent()];
                    case 5:
                        if (!_a.sent()) return [3 /*break*/, 6];
                        return [2 /*return*/, downloadLocation];
                    case 6: return [4 /*yield*/, this.httpDownload(httpOptions, downloadLocation, tempDownloadLocation)];
                    case 7: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MongoDBDownload.prototype.isDownloadPresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var downloadLocation, md5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadLocation()];
                    case 1:
                        downloadLocation = _a.sent();
                        if (!this.locationExists(downloadLocation)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getMD5Hash()];
                    case 2:
                        md5 = _a.sent();
                        return [4 /*yield*/, md5File(downloadLocation)];
                    case 3:
                        if ((_a.sent()) !== md5) {
                            throw ('MD5 signature does not match');
                        }
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MongoDBDownload.prototype.md5File = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, buffer, wstream;
            return __generator(this, function (_a) {
                stream = fs_1.createReadStream(path);
                wstream = fs_1.createWriteStream(buffer);
                stream.pipe(crypto_1.createHash('md5')).pipe(wstream);
                return [2 /*return*/, buffer.toString()];
            });
        });
    };
    MongoDBDownload.prototype.isExtractPresent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.locationExists;
                        return [4 /*yield*/, this.getExtractLocation()];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashFileLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadLocation()];
                    case 1: return [2 /*return*/, (_a.sent()) + '.md5'];
                }
            });
        });
    };
    MongoDBDownload.prototype.cacheMD5Hash = function (signature) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = fs_1.writeFileSync;
                        return [4 /*yield*/, this.getMD5HashFileLocation()];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), signature])];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5Hash = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getMD5HashOffline()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, this.getMD5HashOnline()];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashOnline = function () {
        return __awaiter(this, void 0, void 0, function () {
            var signatureContent, _a, signatureMatch, signature;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = request;
                        return [4 /*yield*/, this.getDownloadURIMD5()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                    case 2:
                        signatureContent = _b.sent();
                        signatureMatch = signatureContent.match(/(.*?)\s/);
                        signature = signatureMatch[1];
                        return [4 /*yield*/, this.cacheMD5Hash(signature)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, signature];
                }
            });
        });
    };
    MongoDBDownload.prototype.getMD5HashOffline = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = fs_1.readFileSync;
                        return [4 /*yield*/, this.getMD5HashFileLocation()];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'utf8'])];
                }
            });
        });
    };
    MongoDBDownload.prototype.httpDownload = function (httpOptions, downloadLocation, tempDownloadLocation) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var fileStream, request;
            return __generator(this, function (_a) {
                fileStream = fs_1.createWriteStream(tempDownloadLocation);
                request = http_1.get(httpOptions, function (response) {
                    _this.downloadProgress.current = 0;
                    _this.downloadProgress.length = parseInt(response.headers['content-length'], 10);
                    _this.downloadProgress.total = Math.round(_this.downloadProgress.length / 1048576 * 10) / 10;
                    response.pipe(fileStream);
                    fileStream.on('finish', function () {
                        fileStream.close();
                        fs_1.renameSync(tempDownloadLocation, downloadLocation);
                        return downloadLocation;
                    });
                    response.on("data", function (chunk) {
                        _this.printDownloadProgress(chunk);
                    });
                    request.on("error", function (e) {
                        throw e;
                    });
                });
                return [2 /*return*/];
            });
        });
    };
    MongoDBDownload.prototype.getCrReturn = function () {
        if (this.mongoDBPlatform.getPlatform() === "win32") {
            return "\x1b[0G";
        }
        else {
            return "\r";
        }
    };
    MongoDBDownload.prototype.locationExists = function (location) {
        var exists;
        try {
            var stats = fs.lstatSync(location);
            this.debug("sending file from cache", location);
            exists = true;
        }
        catch (e) {
            if (e.code !== "ENOENT")
                throw e;
            exists = false;
        }
        return exists;
    };
    MongoDBDownload.prototype.printDownloadProgress = function (chunk) {
        var crReturn = this.getCrReturn();
        this.downloadProgress.current += chunk.length;
        var percent_complete = Math.round(100.0 * this.downloadProgress.current / this.downloadProgress.length * 10) / 10;
        var mb_complete = Math.round(this.downloadProgress.current / 1048576 * 10) / 10;
        var text_to_print = "Completed: " + percent_complete + " % (" + mb_complete + "mb / " + this.downloadProgress.total + "mb" + crReturn;
        if (this.downloadProgress.lastStdout !== text_to_print) {
            this.downloadProgress.lastStdout = text_to_print;
            process.stdout.write(text_to_print);
        }
    };
    MongoDBDownload.prototype.getHttpOptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, proxy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDownloadURI()];
                    case 1:
                        url = _a.sent();
                        if (process.env.HTTP_PROXY) {
                            proxy = new url_1.URL(process.env.HTTP_PROXY);
                            return [2 /*return*/, {
                                    protocol: proxy.protocol,
                                    port: proxy.port,
                                    hostname: proxy.hostname,
                                    method: 'CONNECT',
                                    path: url.href
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    protocol: url.protocol,
                                    port: url.port,
                                    hostname: url.hostname,
                                    path: url.pathname + url.search + url.hash
                                }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        url = DOWNLOAD_URI + '/' + this.mongoDBPlatform.getPlatform();
                        _a = url;
                        _b = '/';
                        return [4 /*yield*/, this.getArchiveName()];
                    case 1:
                        url = _a + (_b + (_c.sent()));
                        return [2 /*return*/, new url_1.URL(url)];
                }
            });
        });
    };
    MongoDBDownload.prototype.getDownloadURIMD5 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDownloadURI().then(function (downloadURI) {
                var downloadURIMD5 = downloadURI.href + ".md5";
                _this.debug("getDownloadURIMD5: " + downloadURIMD5);
                resolve(downloadURIMD5);
            });
        });
    };
    MongoDBDownload.prototype.createDownloadDir = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var dirToCreate = _this.getDownloadDir();
            _this.debug("createDownloadDir(): " + dirToCreate);
            fs.ensureDir(dirToCreate, function (err) {
                if (err) {
                    _this.debug("createDownloadDir() error: " + err);
                    throw err;
                }
                else {
                    _this.debug("createDownloadDir(): true");
                    resolve(true);
                }
            });
        });
    };
    MongoDBDownload.prototype.getArchiveName = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //var name = "mongodb-" + mongo_platform + "-" + mongo_arch;
            var name = "mongodb-" +
                _this.mongoDBPlatform.getPlatform() + "-" +
                _this.mongoDBPlatform.getArch();
            _this.mongoDBPlatform.getOSVersionString().then(function (osString) {
                osString && (name += "-" + osString);
            }, function (error) {
                // nothing to add to name ... yet
            }).then(function () {
                name += "-" + _this.getVersion() + "." + _this.mongoDBPlatform.getArchiveType();
                resolve(name);
            });
        });
    };
    return MongoDBDownload;
}());
exports.MongoDBDownload = MongoDBDownload;
var MongoDBPlatform = /** @class */ (function () {
    function MongoDBPlatform(platform, arch) {
        this.debug = Debug('mongodb-download-MongoDBPlatform');
        this.platform = this.translatePlatform(platform);
        this.arch = this.translateArch(arch, this.getPlatform());
    }
    MongoDBPlatform.prototype.getPlatform = function () {
        return this.platform;
    };
    MongoDBPlatform.prototype.getArch = function () {
        return this.arch;
    };
    MongoDBPlatform.prototype.getArchiveType = function () {
        if (this.getPlatform() === "win32") {
            return "zip";
        }
        else {
            return "tgz";
        }
    };
    MongoDBPlatform.prototype.getCommonReleaseString = function () {
        var name = "mongodb-" + this.getPlatform() + "-" + this.getArch();
        return name;
    };
    MongoDBPlatform.prototype.getOSVersionString = function () {
        if (this.getPlatform() === "linux" && this.getArch() !== "i686") {
            return this.getLinuxOSVersionString();
        }
        else {
            return this.getOtherOSVersionString();
        }
    };
    MongoDBPlatform.prototype.getOtherOSVersionString = function () {
        return new Promise(function (resolve, reject) {
            reject("");
        });
    };
    MongoDBPlatform.prototype.getLinuxOSVersionString = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            getos(function (e, os) {
                if (/ubuntu/i.test(os.dist)) {
                    resolve(_this.getUbuntuVersionString(os));
                }
                else if (/elementary OS/i.test(os.dist)) {
                    resolve(_this.getElementaryOSVersionString(os));
                }
                else if (/suse/i.test(os.dist)) {
                    resolve(_this.getSuseVersionString(os));
                }
                else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
                    resolve(_this.getRhelVersionString(os));
                }
                else if (/fedora/i.test(os.dist)) {
                    resolve(_this.getFedoraVersionString(os));
                }
                else if (/debian/i.test(os.dist)) {
                    resolve(_this.getDebianVersionString(os));
                }
                else {
                    reject("");
                }
            });
        });
    };
    MongoDBPlatform.prototype.getDebianVersionString = function (os) {
        var name = "debian";
        var release = parseFloat(os.release);
        if (release >= 8.1) {
            name += "81";
        }
        else if (release >= 7.1) {
            name += "71";
        }
        else {
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getFedoraVersionString = function (os) {
        var name = "rhel";
        var fedora_version = parseInt(os.release);
        if (fedora_version > 18) {
            name += "70";
        }
        else if (fedora_version < 19 && fedora_version >= 12) {
            name += "62";
        }
        else if (fedora_version < 12 && fedora_version >= 6) {
            name += "55";
        }
        else {
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getRhelVersionString = function (os) {
        var name = "rhel";
        if (/^7/.test(os.release)) {
            name += "70";
        }
        else if (/^6/.test(os.release)) {
            name += "62";
        }
        else if (/^5/.test(os.release)) {
            name += "55";
        }
        else {
            this.debug("using legacy release");
        }
        return name;
    };
    MongoDBPlatform.prototype.getElementaryOSVersionString = function (os) {
        var name = "ubuntu1404";
        return name;
    };
    MongoDBPlatform.prototype.getSuseVersionString = function (os) {
        var release = (os.release.match(/(^11|^12)/) || [null])[0];
        if (release) {
            return "suse" + release;
        }
        else {
            this.debug("using legacy release");
            return '';
        }
    };
    MongoDBPlatform.prototype.getUbuntuVersionString = function (os) {
        var name = "ubuntu";
        var ubuntu_version = os.release ? os.release.split('.') : '';
        var major_version = parseInt(ubuntu_version[0]);
        var minor_version = ubuntu_version[1];
        if (os.release === "12.04") {
            name += "1204";
        }
        else if (os.release === "14.04") {
            name += "1404";
        }
        else if (os.release === "14.10") {
            name += "1410-clang";
        }
        else if (major_version === 14) {
            // default for major 14 to 1404
            name += "1404";
        }
        else if (os.release === "16.04") {
            name += "1604";
        }
        else if (major_version === 16) {
            // default for major 16 to 1604
            name += "1604";
        }
        else {
            // this needs to default to legacy release, this is a BUG
            this.debug("selecting default Ubuntu release 1404");
            name += "1404";
        }
        return name;
    };
    MongoDBPlatform.prototype.translatePlatform = function (platform) {
        var platforms = {
            "darwin": "osx",
            "win32": "win32",
            "linux": "linux",
            "elementary OS": "linux",
            "sunos": "sunos5"
        };
        if (!platforms[platform]) {
            this.debug("unsupported platform %s by MongoDB", platform);
            throw new Error("unsupported OS " + platform);
        }
        return platforms[platform];
    };
    MongoDBPlatform.prototype.translateArch = function (arch, mongoPlatform) {
        if (arch === "ia32") {
            if (mongoPlatform === "linux") {
                return "i686";
            }
            else if (mongoPlatform === "win32") {
                return "i386";
            }
            else {
                this.debug("unsupported mongo platform and os combination");
                throw new Error("unsupported architecture");
            }
        }
        else if (arch === "x64") {
            return "x86_64";
        }
        else {
            this.debug("unsupported architecture");
            throw new Error("unsupported architecture, ia32 and x64 are the only valid options");
        }
    };
    return MongoDBPlatform;
}());
exports.MongoDBPlatform = MongoDBPlatform;
//# sourceMappingURL=mongodb-download.js.map