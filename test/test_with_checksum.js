'use strict'

const download = require('../lib/index')
const test = require('tape')
const verifyDownloadedArchive = require('./helpers').verifyDownloadedArchive

test('Checksum test', (t) => {
  download({
    version: 'latest',
    arch: 'x64',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})
