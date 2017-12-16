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
const getos = require("getos");
const tar_1 = require("tar");
const os_1 = require("os");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
class MongoDBArchive {
    constructor(platform = process.platform, architecture = process.arch, version = 'latest', downloadDirectory = os_1.tmpdir(), extractDirectory = path_1.resolve('../bin')) {
        this.version = version;
        this.downloadDirectory = downloadDirectory;
        this.extractDirectory = extractDirectory;
        this.platforms = {
            "darwin": "osx",
            "win32": "win32",
            "linux": "linux",
            "elementary OS": "linux",
            "sunos": "sunos5"
        };
        this.architectures = {
            "ia32": {
                "linux": "i686",
                "win32": "i386"
            },
            "x64": {
                "linux": "x86_64",
                "win32": "x86_64"
            }
        };
        this.translatedPlatform = this.platforms[platform];
        this.translatedArchitecture = this.architectures[architecture][this.translatedPlatform];
    }
    get name() {
        let name = 'mongodb-' +
            this.translatedPlatform +
            '-' +
            this.translatedArchitecture;
        if (this.translatedPlatform === 'linux' && this.translatedArchitecture !== 'i686') {
            // find the linux distro string
            name += this.getLinuxOSVersion();
        }
        name += '-' + this.version;
        name += this.translatedPlatform === 'win32' ? '.zip' : '.tgz';
        return name;
    }
    get downloadPath() {
        return path_1.join(this.downloadDirectory, this.name);
    }
    extract() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create extract directory
            fs_1.mkdirSync(this.extractDirectory);
            // Extract into extract directory
            return tar_1.extract({
                file: this.downloadPath,
                cwd: this.extractDirectory
            });
        });
    }
    verify(signature) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Verifies that archive was downloaded correctly
                // compare md5 of archive to retrieved md5
                let hasher = crypto_1.createHash('md5');
                let stream = fs_1.createReadStream(this.downloadPath);
                stream.on('end', () => {
                    let archiveSignature = hasher.digest().toString('hex');
                    resolve(archiveSignature === signature);
                });
                stream.on('data', data => {
                    hasher.update(data);
                });
            });
        });
    }
    getLinuxOSVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                getos((err, os) => {
                    if (/ubuntu/i.test(os.dist)) {
                        resolve('-' + this.getUbuntuVersionString(os));
                    }
                    else if (/elementary OS/i.test(os.dist)) {
                        resolve('-' + this.getElementaryOSVersionString(os));
                    }
                    else if (/suse/i.test(os.dist)) {
                        resolve('-' + this.getSuseVersionString(os));
                    }
                    else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
                        resolve('-' + this.getRhelVersionString(os));
                    }
                    else if (/fedora/i.test(os.dist)) {
                        resolve('-' + this.getFedoraVersionString(os));
                    }
                    else if (/debian/i.test(os.dist)) {
                        resolve('-' + this.getDebianVersionString(os));
                    }
                    resolve("");
                });
            });
        });
    }
    getDebianVersionString(os) {
        let name = "debian";
        let release = parseFloat(os.release);
        if (release >= 8.1) {
            name += "81";
        }
        else if (release >= 7.1) {
            name += "71";
        }
        return name;
    }
    getFedoraVersionString(os) {
        let name = "rhel";
        let fedora_version = parseInt(os.release);
        if (fedora_version > 18) {
            name += "70";
        }
        else if (fedora_version < 19 && fedora_version >= 12) {
            name += "62";
        }
        else if (fedora_version < 12 && fedora_version >= 6) {
            name += "55";
        }
        else
            return name;
    }
    getRhelVersionString(os) {
        let name = "rhel";
        if (/^7/.test(os.release)) {
            name += "70";
        }
        else if (/^6/.test(os.release)) {
            name += "62";
        }
        else if (/^5/.test(os.release)) {
            name += "55";
        }
        else
            return name;
    }
    getElementaryOSVersionString(os) {
        return "ubuntu1404";
    }
    getSuseVersionString(os) {
        let release = os.release.match(/(^11|^12)/);
        if (release.length > 0) {
            return 'suse' + release[0];
        }
        else {
            return '';
        }
    }
    getUbuntuVersionString(os) {
        let name = "ubuntu";
        let ubuntu_version = os.release ? os.release.split('.') : '';
        let major_version = parseInt(ubuntu_version[0]);
        let minor_version = ubuntu_version[1];
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
            name += "1404";
        }
        return name;
    }
}
exports.MongoDBArchive = MongoDBArchive;
//# sourceMappingURL=mongodb-archive.js.map