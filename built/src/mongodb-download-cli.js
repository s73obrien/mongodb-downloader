#!/usr/bin/env node
let { MongoDBDownload } = require('./mongodb-download');
let argv = require('yargs')
    .alias("dp", "display_progress")
    .boolean('display_progress')
    .default("display_progress", true)
    .argv;
let mongoDBDownload = new MongoDBDownload(argv);
mongoDBDownload.download().then((downloadLocation) => {
    console.log(`Downloaded MongoDB: ${downloadLocation}`);
    process.exit(0);
}, (err) => {
    throw err;
});
//# sourceMappingURL=mongodb-download-cli.js.map