'use strict'

const download = require('../lib/index')
const fs = require('fs')
const path = require('path')
const temp = require('temp').track()
const test = require('tape')
const verifyDownloadedArchive = require('./helpers').verifyDownloadedArchive

test('Basic test', (t) => {
  download({
    version: 'latest',
    arch: 'ia32',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})

test('Force option', (t) => {
  const cachePath = temp.mkdirSync('mongodb-download-')

  fs.writeFileSync(path.join(cachePath, 'SHASUMS256.txt-1.4.13'), '')

  download({
    version: 'latest',
    arch: 'ia32',
    platform: 'win32',
    cache: cachePath,
    force: true,
    quiet: false
  }, (err, archivePath) => {
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})
