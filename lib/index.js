'use strict'
require('dotenv').config()
const debug = require('debug')('mongodb-download')
const util = require('util')
const envPaths = require('env-paths')

const fs = require('fs-extra')
const rc = require('rc')
const os = require('os')
const path = require('path')

const nugget = util.promisify(require('nugget'))
const mkdir = util.promisify(require('fs').mkdir)
const stat = util.promisify(require('fs').stat)
const rename = util.promisify(require('fs').rename)
const unlink = util.promisify(require('fs').unlink)

class MongoDBDownloader {
  constructor(opts) {
    this.opts = opts

    this.npmrc = {}
    try {
      rc('npm', this.npmrc)
    } catch (error) {
      console.error(`Error reading npm configuration: ${error.message}`)
    }
  }

  get baseUrl() {
    return process.env.NPM_CONFIG_MONGODB_MIRROR ||
      process.env.npm_config_mongodb_mirror ||
      process.env.MONGODB_MIRROR ||
      this.opts.mirror ||
      'https://fastdl.mongodb.org'
  }

  get middleUrl() {
    return process.env.MONGODB_CUSTOM_DIR || this.opts.customDir || this.platform
  }

  get urlSuffix() {
    return process.env.MONGODB_CUSTOM_FILENAME || this.opts.customFilename || this.filename
  }

  get arch() {
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

  async getCacheLocation() {
    const oldCacheDirectory = path.join(os.homedir(), './.mongodb')
    if (await stat(path.join(oldCacheDirectory, this.filename)).exists) {
      return oldCacheDirectory
    }

    // use passed argument or XDG environment variable fallback to OS default
    return envPaths('mongodb', {
      suffix: ''
    }).cache
  }

  get cachedArchive() {
    return path.join(this.cache, this.filename)
  }

  get filename() {
    const type = `${this.platform}-${this.arch}`
    const fileType = this.platform === 'win32' ? 'zip' : 'tgz'

    return `mongodb-${type}-${this.version}.${fileType}`
  }

  get platform() {
    const platforms = {
      'darwin': 'osx',
      'win32': 'win32',
      'linux': 'linux',
      'elementary OS': 'linux', // os.platform() doesn't return linux for elementary OS.
      'sunos': 'sunos5'
    }

    return platforms[this.opts.platform] || platforms[os.platform()]
  }

  get proxy() {
    let proxy
    if (this.npmrc && this.npmrc.proxy) proxy = this.npmrc.proxy
    if (this.npmrc && this.npmrc['https-proxy']) proxy = this.npmrc['https-proxy']

    return proxy
  }

  get quiet() {
    return this.opts.quiet || process.stdout.rows < 1
  }

  get strictSSL() {
    let strictSSL = true
    if (this.opts.strictSSL === false || this.npmrc['strict-ssl'] === false) {
      strictSSL = false
    }

    return strictSSL
  }

  get force() {
    return this.opts.force || false
  }

  get url() {
    return `${this.baseUrl}/${this.middleUrl}/${this.urlSuffix}`
  }

  get version() {
    return this.opts.version
  }

  async downloadFile(url, cacheFilename) {
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

    return new Promise((resolve, reject) => {
      nugget(url, nuggetOpts, (errors) => {
        if (errors) {
          // nugget returns an array of errors but we only need 1st because we only have 1 url
          reject(errors[0])
        }

        resolve(this.moveFileToCache(tempFileName, cacheFilename))
      })
    })
  }


  async handleDownloadError(error) {
    if (error.message.indexOf('403') === -1) return error
    error.message = `Failed to find MongoDB v${this.version} for ${this.platform}-${this.arch} at ${this.url}`

    return error
  }

  async moveFileFromCache(filename, target) {
    const cache = this.cache
    debug('moving', filename, 'from', cache, 'to', target)
    try {
      await rename(path.join(cache, filename), target)
    } catch (error) {
      unlink(cache)
    }
  }

  async downloadIfNotCached() {
    if (!this.version) {
      throw new Error('must specify version')
    }

    debug('info', {
      cache: this.cache,
      filename: this.filename,
      url: this.url
    })

    if (await stat(this.cachedArchive).exists && !this.force) {
      debug('archive cached', this.cachedArchive)
      return (this.cachedArchive)
    } else {
      await this.ensureCacheDir()
      return this.downloadFile()
    }
  }

  // Determines the best place to put the cache directory and returns it.
  async resolveCacheDir () {
    debug('resolving cache dir')
    let cacheDirectory
    // First try the location specified in the options or environment variables
    try {
      cacheDirectory = this.opts.cache || process.env.MONGODB_CACHE
      // Try to make the directory
      mkdir(cacheDirectory)
    } catch (error) {
      if (error.code === 'EEXIST') {
        // ignore EEXIST and let cache be stored
      } else if (error.code === 'EACCES') {
        // if we are getting access denied then we'll
        // try local folder (e.g. some linuxes return '/' as homedir)
        cacheDirectory = path.resolve('./.mongodb');
        mkdir(path.resolve('./.mongodb'))
      } else {
        // if our error is anything but EEXIST (handled above) or EACCES
        // throw it out of the function
        throw error
      }
    }
    this.opts.cache = cacheDirectory // store the successful candidate
  }
}

MongoDBDownloader.tmpFileCounter = 0

module.exports = function download (opts, cb) {
  const downloader = new MongoDBDownloader(opts)
  downloader.downloadIfNotCached(cb)
}
