'use strict'

const debug = require('debug')('mongodb-download')
const envPaths = require('env-paths')
const fs = require('fs-extra')
const rc = require('rc')
const nugget = require('nugget')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists')
const semver = require('semver')
const sumchecker = require('sumchecker')

class MongoDBDownloader {
  constructor (opts) {
    this.opts = opts

    this.npmrc = {}
    try {
      rc('npm', this.npmrc)
    } catch (error) {
      console.error(`Error reading npm configuration: ${error.message}`)
    }
  }

  get baseUrl () {
    return process.env.NPM_CONFIG_MONGODB_MIRROR ||
      process.env.npm_config_mongodb_mirror ||
      process.env.MONGODB_MIRROR ||
      this.opts.mirror ||
      'https://fastdl.mongodb.org'
  }

  get middleUrl () {
    return process.env.MONGODB_CUSTOM_DIR || this.opts.customDir || this.platform
  }

  get urlSuffix () {
    return process.env.MONGODB_CUSTOM_FILENAME || this.opts.customFilename || this.filename
  }

  get arch () {
    const architectures = {
      'ia32': {
        'linux': 'i686',
        'win32': 'i386'
      },
      'x64': {
        'linux': 'x86_64',
        'win32': 'x86_64'
      }
    }

    return architectures[os.arch()][this.platform] || architectures[os.arch()][this.platform]
  }

  get cache () {
    const cacheLocation = this.opts.cache || process.env.MONGODB_CACHE
    if (cacheLocation) return cacheLocation

    const oldCacheDirectory = path.join(os.homedir(), './.mongodb')
    if (pathExists.sync(path.join(oldCacheDirectory, this.filename))) {
      return oldCacheDirectory
    }
    // use passed argument or XDG environment variable fallback to OS default
    return envPaths('mongodb', {
      suffix: ''
    }).cache
  }

  get cachedChecksum () {
    return path.join(this.cache, `${this.checksumFilename}-${this.version}`)
  }

  get cachedArchive () {
    return path.join(this.cache, this.filename)
  }

  get checksumFilename () {
    return 'SHASUMS256.txt'
  }

  get checksumUrl () {
    return `${this.baseUrl}/${this.middleUrl}/${this.checksumFilename}`
  }

  get filename () {
    const type = `${this.platform}-${this.arch}`
    const fileType = this.platform === 'win32' ? 'zip' : 'tgz'

    return `mongodb-${type}-${this.version}.${fileType}`
  }

  get platform () {
    const platforms = {
      'darwin': 'osx',
      'win32': 'win32',
      'linux': 'linux',
      'elementary OS': 'linux', // os.platform() doesn't return linux for elementary OS.
      'sunos': 'sunos5'
    }

    return platforms[this.opts.platform] || platforms[os.platform()]
  }

  get proxy () {
    let proxy
    if (this.npmrc && this.npmrc.proxy) proxy = this.npmrc.proxy
    if (this.npmrc && this.npmrc['https-proxy']) proxy = this.npmrc['https-proxy']

    return proxy
  }

  get quiet () {
    return this.opts.quiet || process.stdout.rows < 1
  }

  get strictSSL () {
    let strictSSL = true
    if (this.opts.strictSSL === false || this.npmrc['strict-ssl'] === false) {
      strictSSL = false
    }

    return strictSSL
  }

  get force () {
    return this.opts.force || false
  }

  get url () {
    return `${this.baseUrl}/${this.middleUrl}/${this.urlSuffix}`
  }

  get version () {
    return this.opts.version || 'latest'
  }

  checkForCachedChecksum (cb) {
    pathExists(this.cachedChecksum)
      .then(exists => {
        if (exists && !this.force) {
          this.verifyChecksum(cb)
        } else {
          this.downloadChecksum(cb)
        }
      })
  }

  checkForCachedArchive (cb) {
    pathExists(this.cachedArchive).then(exists => {
      if (exists && !this.force) {
        debug('archive exists', this.cachedArchive)
        cb(null, this.cachedArchive)
      } else {
        this.ensureCacheDir(cb)
      }
    })
  }

  checkIfArchiveNeedsVerifying (cb) {
    if (this.verifyChecksumNeeded) {
      debug('Verifying archive with checksum')
      return this.checkForCachedChecksum(cb)
    }
    return cb(null, this.cachedArchive)
  }

  createCacheDir (cb) {
    fs.mkdirs(this.cache, (err) => {
      if (err) {
        if (err.code !== 'EACCES') return cb(err)
        // try local folder if homedir is off limits (e.g. some linuxes return '/' as homedir)
        const localCache = path.resolve('./.mongodb')
        return fs.mkdirs(localCache, function (err) {
          if (err) return cb(err)
          cb(null, localCache)
        })
      }
      cb(null, this.cache)
    })
  }

  downloadChecksum (cb) {
    this.downloadFile(this.checksumUrl, this.cachedChecksum, cb, this.verifyChecksum.bind(this))
  }

  downloadFile (url, cacheFilename, cb, onSuccess) {
    const tempFileName = `tmp-${process.pid}-${(MongoDBDownloader.tmpFileCounter++).toString(16)}-${path.basename(cacheFilename)}`
    debug('downloading', url, 'to', this.cache)
    const nuggetOpts = {
      target: tempFileName,
      dir: this.cache,
      resume: true,
      quiet: this.quiet,
      strictSSL: this.strictSSL,
      proxy: this.proxy
    }
    nugget(url, nuggetOpts, (errors) => {
      if (errors) {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        return this.handleDownloadError(cb, errors[0])
      }

      this.moveFileToCache(tempFileName, cacheFilename, cb, onSuccess)
    })
  }

  downloadIfNotCached (cb) {
    if (!this.version) return cb(new Error('must specify version'))
    debug('info', {
      cache: this.cache,
      filename: this.filename,
      url: this.url
    })
    this.checkForCachedArchive(cb)
  }

  downloadArchive (cb) {
    this.downloadFile(this.url, this.cachedArchive, cb, this.checkIfArchiveNeedsVerifying.bind(this))
  }

  ensureCacheDir (cb) {
    debug('creating cache dir')
    this.createCacheDir((err, actualCache) => {
      if (err) return cb(err)
      this.opts.cache = actualCache // in case cache dir changed
      this.downloadArchive(cb)
    })
  }

  handleDownloadError (cb, error) {
    if (error.message.indexOf('404') === -1) return cb(error)
    error.message = `Failed to find MongoDB v${this.version} for ${this.platform}-${this.arch} at ${this.url}`

    return cb(error)
  }

  moveFileToCache (filename, target, cb, onSuccess) {
    const cache = this.cache
    debug('moving', filename, 'from', cache, 'to', target)
    fs.rename(path.join(cache, filename), target, (err) => {
      if (err) {
        fs.unlink(cache, cleanupError => {
          try {
            if (cleanupError) {
              console.error(`Error deleting cache file: ${cleanupError.message}`)
            }
          } finally {
            cb(err)
          }
        })
      } else {
        onSuccess(cb)
      }
    })
  }

  verifyChecksum (cb) {
    const options = {}
    if (semver.lt(this.version, '1.3.5')) {
      options.defaultTextEncoding = 'binary'
    }
    const checker = new sumchecker.ChecksumValidator('sha256', this.cachedChecksum, options)
    checker.validate(this.cache, this.filename).then(() => {
      cb(null, this.cachedArchive)
    }, (err) => {
      fs.unlink(this.cachedArchive, (fsErr) => {
        if (fsErr) return cb(fsErr)
        cb(err)
      })
    })
  }
}

MongoDBDownloader.tmpFileCounter = 0

module.exports = function download (opts, cb) {
  const downloader = new MongoDBDownloader(opts)
  downloader.downloadIfNotCached(cb)
}
