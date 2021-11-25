
const chalk = require('react-dev-utils/chalk');
const path = require('path')
const fs = require('fs')
/**
 * @author Hank
 * @description 加载配置文件
 */
function loadConfig() {
    let fileConfig, pkgConfig, resolved, resolvedFrom;
    const configPath =
      process.env.FIG_CLI_SERVICE_CONFIG_PATH ||
      path.resolve(process.cwd(), "feup.config.js");

    if (fs.existsSync(configPath)) {
      try {
        fileConfig = require(configPath);

        if (typeof fileConfig === "function") {
          fileConfig = fileConfig();
        }

        if (!fileConfig || typeof fileConfig !== "object") {
          console.error(
            `Error loading ${chalk.bold(
              "feup.config.js"
            )}: should export an object or a function that returns object.`
          );
          fileConfig = null;
        }
      } catch (e) {
        console.error(`Error loading ${chalk.bold("feup.config.js")}:`);
        throw e;
      }
    }else{
      console.error(`哥们你${chalk.bold("feup.config.js")}名字写错了！`);
    }

    resolved = fileConfig;
    return resolved;
  }

  module.exports = loadConfig
