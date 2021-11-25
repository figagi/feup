"use strict";

const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const chalk = require("chalk");
const validateProjectName = require("validate-npm-package-name");
const got = require("got");
const InitProject = require("./InitProject");

async function create(projectName, options) {
  // 暂时没有用到
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy;
  }
  // 执行路径
  const cwd = options.cwd || process.cwd();
  // 在当前目录
  const inCurrent = projectName === ".";
  // 拿到当前目录的名字
  const name = inCurrent ? path.relative("../", cwd) : projectName;
  // 目标文件夹绝对路径
  const targetDir = path.resolve(cwd, projectName || ".");
  // 验证是否是一个有效的package name
  const result = validateProjectName(name);
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`));
    result.errors &&
      result.errors.forEach((err) => {
        console.error(chalk.red.dim("Error: " + err));
      });
    result.warnings &&
      result.warnings.forEach((warn) => {
        console.error(chalk.red.dim("Warning: " + warn));
      });
    process.exit(1);
  }

  const projectInfo = await getProject();
  const selectProjectName = await selectProject(projectInfo);
  console.log(`\n ${chalk.cyan(selectProjectName)}...`);

  const existStatus = await existsTargetDir({
    targetDir,
    options,
    inCurrent,
  });
  if (!existStatus) return;
  // 创建项目
  const initProject = new InitProject({
    name,
    targetDir,
    gitRepo: projectInfo[selectProjectName].repo,
    branch: projectInfo[selectProjectName].branch || "master",
  });
  await initProject.create(options);
}

async function selectProject(projectInfo) {
  const { action } = await inquirer.prompt([
    {
      name: "action",
      type: "list",
      message: `请你选择需要的项目:`,
      choices: [
        ...Object.keys(projectInfo).map((item) => ({
          name: item,
          value: item,
        })),
      ],
    },
  ]);

  return action;
}

function existsTargetDir({ targetDir, options, inCurrent }) {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(targetDir) && !options.merge) {
      if (options.force) {
        await fs.remove(targetDir);
        resolve(true);
      } else {
        if (inCurrent) {
          const { ok } = await inquirer.prompt([
            {
              name: "ok",
              type: "confirm",
              message: `Generate project in current directory?`,
            },
          ]);
          resolve(ok);
        } else {
          const { action } = await inquirer.prompt([
            {
              name: "action",
              type: "list",
              message: `Target directory ${chalk.cyan(
                targetDir
              )} already exists. Pick an action:`,
              choices: [
                { name: "Overwrite", value: "overwrite" },
                { name: "Merge", value: "merge" },
                { name: "Cancel", value: false },
              ],
            },
          ]);
          if (action === "overwrite") {
            console.log(`\nRemoving ${chalk.cyan(targetDir)}...`);
            await fs.remove(targetDir);
          }
          resolve(!!action);
        }
      }
    } else {
      resolve(true);
    }
  });
}

async function getProject() {
  try {
    const response = await got(
      "https://ali-cyb-cdn.kaikeba.com/chanyan/feup/repository.json"
    ).json();
    return response;
  } catch ({ message }) {
    console.error(" ");
    console.error(chalk.red.dim(`获取项目失败！`));
    console.error(chalk.red.dim(`Error: ${message}`));
    process.exit(1);
  }
}

module.exports = (...args) => {
  return create(...args).catch((err) => {
    console.error(err);
  });
};
