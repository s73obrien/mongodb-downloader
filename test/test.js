'use strict'

const download = require('../lib/index')
const fs = require('fs')
const os = require('os')
const ensureDir = require('fs-extra').ensureDirSync
const path = require('path')
const temp = require('temp').track()
const test = require('tape')

function verifyDownloadedArchive (t, err, archivePath) {
  t.error(err, 'Error should be null')

  if (err == null) {
    t.equal(fs.statSync(archivePath).isFile(), true, 'Archive path should exist')
    t.notEqual(fs.statSync(archivePath).size, 0, 'Archive path should be non-empty')
  }
}

test('Basic test', (t) => {
  download({
    version: '1.0.0',
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

  download({
    version: '1.0.0',
    arch: 'ia32',
    platform: 'win32',
    // cache: cachePath,
    force: true,
    quiet: false
  }, (err, archivePath) => {
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})

test('bad config test', (t) => {
  const configPath = path.join(os.homedir(), '.config', 'npm', 'config')
  ensureDir(path.dirname(configPath))
  fs.writeFileSync(configPath, '{')

  download({
    version: '1.0.0',
    arch: 'ia32',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    fs.unlinkSync(configPath)
    verifyDownloadedArchive(t, err, archivePath)
    t.end()
  })
})

test('403 test', (t) => {
  download({
    version: '0.0.1',
    arch: 'ia32',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    if (!err) t.fail('Download should throw an error')
    t.equal(fs.existsSync(archivePath), false, 'Archive path should not exist')
    t.notStrictEqual(err, 'Error: Failed to find MongoDB v0.0.1 for win32-x86_64 at https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-0.0.1.zip', 'Error message should show version and platform')
    t.end()
  })
})
