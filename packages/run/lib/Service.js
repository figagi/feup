"use strict";
const spawn = require("react-dev-utils/crossSpawn");
const chalk = require("chalk");
const paths = require("../config/paths");
const reportPlugins = require("../config/reportPlugins");

const appPackageJson = require(paths.appPackageJson);
class Service {
  constructor(context) {
    this.mode = "";
    this.env = "";
    this.context = context;
  }

  init(params) {
    this.initialized = true;
    const { env, mode } = params;
    this.mode = mode;
    this.env = env;
    const config = this.loadConfig();
    config.name = config.name || appPackageJson.name;
    process.env.FIG_CONFIG = JSON.stringify(config);
    process.env.FEUP_ENV = this.env;
    process.env.FIG_MODE = this.mode;
    this.start(config);
  }

  async start(config) {
    if (!["build", "start"].includes(this.mode)) {
      console.log(chalk.red(this.mode, " -m params is not support"));
      console.log();
      process.exit(1);
    }
    if (config.onCheck) {
      if (
        Object.prototype.toString.call(config.onCheck) ===
        "[object AsyncFunction]"
      ) {
        try {
          await config.onCheck(this.env, this.mode, config);
        } catch (err) {
          console.log(err);
          process.exit(1);
        }
      } else {
        !config.onCheck(this.env, this.mode, config) && process.exit(1);
      }
    }

    const startTime = new Date().getTime();
    const other = {
      env: this.env,
      mode: this.mode,
      startTime,
      config,
    };
    const result = spawn.sync(
      "node",
      [require.resolve("../scripts/" + this.mode), this.env],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          other: JSON.stringify(other),
        },
      }
    );
    // console.log("result", result);
    if (result.status !== 0) {
      const report = async () => {
        const Log = new reportPlugins({ ...other, diy: true });
        await Log.init();
        Log.report(false);
      };
      report();
    }

    if (result.signal) {
      if (result.signal === "SIGKILL") {
        console.log(
          "The build failed because the process exited too early. " +
            "This probably means the system ran out of memory or someone called " +
            "`kill -9` on the process."
        );
      } else if (result.signal === "SIGTERM") {
        console.log(
          "The build failed because the process exited too early. " +
            "Someone might have called `kill` or `killall`, or the system could " +
            "be shutting down."
        );
      }
      process.exit(1);
    }
    // process.exit(result.status);
  }

  async run(args = {}) {
    this.init(args);
  }

  loadConfig() {
    return require("../scripts/utils/loadFigConfig")() || {};
  }
}

module.exports = Service;
