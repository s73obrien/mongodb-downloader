'use strict'

const download = require('../lib/index')
const fs = require('fs')
const test = require('tape')

test('403 test', (t) => {
  download({
    version: '0.0.1',
    arch: 'ia32',
    platform: 'win32',
    quiet: false
  }, (err, archivePath) => {
    if (!err) t.fail('Download should throw an error')
    t.equal(fs.existsSync(archivePath), false, 'Archive path should not exist')
    t.end()
  })
})
