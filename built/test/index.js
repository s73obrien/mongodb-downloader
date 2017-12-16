"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../src/mongodb-download");
const mongodb_download_1 = require("../src/mongodb-download");
let dl = new mongodb_download_1.default();
dl.install().then(() => console.log('done'));
//# sourceMappingURL=index.js.map