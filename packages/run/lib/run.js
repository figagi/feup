"use strict";
const Service = require("./Service");

function run({ env, mode }, options) {
  const help = require("../scripts/help");
  if (!env || !mode) {
    console.log("please set params -e and -m");
    help();
    process.exit(1);
  }
  const service = new Service(process.cwd());
  service.run({ env, mode }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = run;
