import * as getos from 'getos';
import { extract } from 'tar';

import {
  tmpdir
} from 'os';

import {
  resolve,
  join
} from 'path';

import {
  createHash
} from 'crypto';

import {
  createReadStream,
  mkdirSync,
  mkdir
} from 'fs';

export class MongoDBArchive {
  private platforms: { [key: string]: string } = {
    "darwin": "osx",
    "win32": "win32",
    "linux": "linux",
    "elementary OS": "linux", //os.platform() doesn't return linux for elementary OS.
    "sunos": "sunos5"
  };

  private architectures: { [key: string]: any } = {
    "ia32": {
      "linux": "i686",
      "win32": "i386"
    },
    "x64": {
      "linux": "x86_64",
      "win32": "x86_64"
    }
  };

  public translatedPlatform: string;
  private translatedArchitecture: string;

  constructor(
    platform: string = process.platform,
    architecture: string = process.arch,
    private version: string = 'latest',
    private downloadDirectory: string = tmpdir(),
    private extractDirectory: string = resolve('../bin')
  ) {
    this.translatedPlatform = this.platforms[platform];
    this.translatedArchitecture = this.architectures[architecture][this.translatedPlatform];
  }

  public get name(): string {
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

  public get downloadPath(): string {
    return join(this.downloadDirectory, this.name);
  }

  public async extract(): Promise<void> {

    // Create extract directory
    mkdir(this.extractDirectory, (err: NodeJS.ErrnoException) => {
      
    });

    // Extract into extract directory
    return extract({
      file: this.downloadPath,
      cwd: this.extractDirectory
    })
  }

  public async verify(signature: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Verifies that archive was downloaded correctly
      // compare md5 of archive to retrieved md5
      let hasher = createHash('md5');
      let stream = createReadStream(this.downloadPath);
      stream.on('end', () => {
        let archiveSignature = hasher.digest().toString('hex');
        resolve (archiveSignature === signature);
      })

      stream.on('data', data => {
        hasher.update(data);
      })
    });

  }

  private async getLinuxOSVersion(): Promise<string> {
    return new Promise<string>((resolve, reject) => {

      getos((err, os: getos.LinuxOs) => {
        if (/ubuntu/i.test(os.dist)) {
          resolve('-' + this.getUbuntuVersionString(os));
        } else if (/elementary OS/i.test(os.dist)) {
          resolve('-' + this.getElementaryOSVersionString(os));
        } else if (/suse/i.test(os.dist)) {
          resolve('-' + this.getSuseVersionString(os));
        } else if (/rhel/i.test(os.dist) || /centos/i.test(os.dist) || /scientific/i.test(os.dist)) {
          resolve('-' + this.getRhelVersionString(os));
        } else if (/fedora/i.test(os.dist)) {
          resolve('-' + this.getFedoraVersionString(os));
        } else if (/debian/i.test(os.dist)) {
          resolve('-' + this.getDebianVersionString(os));
        }

        resolve("");
      });
    });
  }

  getDebianVersionString(os: getos.LinuxOs): string {
    let name: string = "debian";
    let release: number = parseFloat(os.release);
    if (release >= 8.1) {
      name += "81";
    } else if (release >= 7.1) {
      name += "71";
    }

    return name;
  }

  getFedoraVersionString(os: getos.LinuxOs): string {
    let name: string = "rhel";
    let fedora_version: number = parseInt(os.release);
    if (fedora_version > 18) {
      name += "70";
    } else if (fedora_version < 19 && fedora_version >= 12) {
      name += "62";
    } else if (fedora_version < 12 && fedora_version >= 6) {
      name += "55";
    } else

      return name;
  }

  getRhelVersionString(os: getos.LinuxOs): string {
    let name: string = "rhel";
    if (/^7/.test(os.release)) {
      name += "70";
    } else if (/^6/.test(os.release)) {
      name += "62";
    } else if (/^5/.test(os.release)) {
      name += "55";
    } else

      return name;
  }

  getElementaryOSVersionString(os: getos.LinuxOs): string {
    return "ubuntu1404";
  }

  getSuseVersionString(os: getos.LinuxOs): string {
    let release: RegExpMatchArray = os.release.match(/(^11|^12)/);

    if (release.length > 0) {
      return 'suse' + release[0];
    } else {
      return '';
    }
  }

  getUbuntuVersionString(os: getos.LinuxOs): string {
    let name: string = "ubuntu";
    let ubuntu_version: string | string[] = os.release ? os.release.split('.') : '';
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
      name += "1404";
    }
    return name;
  }
}