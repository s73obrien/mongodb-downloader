# mongodb-downloader

This downloads a MongoDB release zip/tgz from fastdl.mongodb.org.

It is heavily influenced by [electron-download](https://github.com/electron-userland/electron-download.git) and [mongodb-download](https://github.com/winfinit/mongodb-download.git)

### Usage

**Note: Requires Node >= 4.0 to run.**

```shell
$ npm install --global mongodb-downloader
$ mongodb-download --version=3.6.0
```

```javascript
const download = require('mongodb-downloader')

download({
  version: '3.6.0',
  arch: 'ia32',
  platform: 'win32',
  cache: './archives'
}, function (err, archivePath) {
  // archivePath will be the path of the archive that it downloaded.
  // If the archive was already cached it will skip
  // downloading and call the cb with the cached archive path.
  // If it wasn't cached it will download the archive and save
  // it in the cache path.
})
```

If you don't specify `arch` or `platform` args it will use the built-in `os` module to get the values from the current OS. Specifying `version` is mandatory. If there is a `SHASUMS256.txt` file available for the `version`, the file downloaded will be validated against its checksum to ensure that it was downloaded without errors.

If you would like to override the mirror location, three options are available. The mirror URL is composed as `url = MONGODB_MIRROR + '/' + MONGODB_CUSTOM_DIR + '/' + MONGODB_CUSTOM_FILENAME`.

You can set the `MONGODB_MIRROR` or [`NPM_CONFIG_MONGODB_MIRROR`](https://docs.npmjs.com/misc/config#environment-variables) environment variable or `mirror` opt variable to use a custom base URL for grabbing MONGODB zips. The same pattern applies to `MONGODB_CUSTOM_DIR` and `MONGODB_CUSTOM_FILENAME`:

## or for a local mirror
MONGODB_MIRROR="https://10.1.2.105/"
MONGODB_CUSTOM_DIR="our/internal/filePath"
```

You can set MONGODB_MIRROR in `.npmrc` as well, using the lowercase name:

```plain
mongodb_mirror=https://10.1.2.105/
```

### Cache location
The location of the cache depends on the operating system, the defaults are:
- Linux: `$XDG_CACHE_HOME` or `~/.cache/mongodb/`
- MacOS: `~/Library/Caches/mongodb/`
- Windows: `$LOCALAPPDATA/mongodb/Cache` or `~/AppData/Local/mongodb/Cache/`

You can set the `MONGODB_CACHE` environment variable to set cache location explicitly.
