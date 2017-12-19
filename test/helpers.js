
'use strict'

const fs = require('fs')

exports.verifyDownloadedArchive = (t, err, archivePath) => {
  t.error(err, 'Error should be null')

  if (err == null) {
    t.equal(fs.statSync(archivePath).isFile(), true, 'Archive path should exist')
    t.notEqual(fs.statSync(archivePath).size, 0, 'Archive path should be non-empty')
  }
}
