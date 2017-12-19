'use strict'

const download = require('../lib/index')
const fs = require('fs')
const ensureDir = require('fs-extra').ensureDirSync
const os = require('os')
const path = require('path')
const test = require('tape')
const verifyDownloadedArchive = require('./helpers').verifyDownloadedArchive

test('bad config test', (t) => {
  const configPath = path.join(os.homedir(), '.config', 'npm', 'config')
  ensureDir(path.dirname(configPath))
  fs.writeFileSync(configPath, '{')

  download({
    version: 'latest',
    arch: 'ia32',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    fs.unlinkSync(configPath)
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})
