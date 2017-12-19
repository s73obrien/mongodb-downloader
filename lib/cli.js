#!/usr/bin/env node

'use strict'

const download = require('./')
const minimist = require('minimist')

const opts = minimist(process.argv.slice(2))

if (opts['strict-ssl'] === false) {
  opts.strictSSL = false
}

download(opts, (err, archivePath) => {
  if (err) throw err
  console.log('Downloaded archive:', archivePath)
  process.exit(0)
})
