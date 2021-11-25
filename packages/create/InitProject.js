const inquirer = require("inquirer");
const chalk = require("chalk");
const EventEmitter = require("events");
const childProcess = require("child_process");
module.exports = class InitProject extends EventEmitter {
  constructor({ name, targetDir, gitRepo, branch }, context, promptModules) {
    super();

    this.name = name;
    this.targetDir = targetDir;
    this.gitRepo = gitRepo;
    this.branch = branch;
    this.context = process.env.FEUP_CLI_CONTEXT = context;
    this.injectedPrompts = [];
    this.promptCompleteCbs = [];
    this.afterInvokeCbs = [];
    this.afterAnyInvokeCbs = [];
    this.run = this.run.bind(this);
  }

  run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      if (!args) {
        [command, ...args] = command.split(/\s+/);
      }
      console.log("command", command, args);
      const spawn = childProcess.spawn(command, args, options);

      spawn.stdout.on("data", (data) => {
        console.log(`${data}`);
      });

      spawn.stderr.on("data", (data) => {
        console.error(`${data}`);
      });

      spawn.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        if (code === 0) {
          resolve();
        }
      });

      spawn.on("error", (err) => {
        reject(err);
      });
    });
  }

  async create(cliOptions = {}, preset = null) {
    const createStatus = await this.createProject();
    if (!createStatus) return;
    await this.initDependency();
  }

  createProject(option) {
    return new Promise(async (resolve) => {
      const { run } = this;
      try {
        await run("git", ["clone", "-b", this.branch, this.gitRepo, this.name]);
        await run("rm", ["-rf", `./${this.name}/.git`]);
        console.log(chalk.green(`初始化${this.name}项目成功`));
        resolve(true);
      } catch (err) {
        console.error(chalk.red(err.stack), {
          ...err,
        });
        resolve(false);
      }
    });
  }

  // 选择初始化依赖
  async initDependency() {
    const { ok } = await inquirer.prompt([
      {
        name: "ok",
        type: "confirm",
        message: `需要初始化依赖吗?`,
      },
    ]);

    if (!ok) return;

    // remove npm
    // const { type } = await inquirer.prompt([
    //   {
    //     name: "type",
    //     type: "list",
    //     message: `Choose ‘${chalk.green(`yarn`)}’ or ‘${chalk.green(
    //       `npm`
    //     )}’ to initialize:`,
    //     choices: [
    //       { name: "Yarn", value: "yarn" },
    //       { name: "NPM", value: "npm" },
    //     ],
    //   },
    // ]);
    const type = "yarn";

    try {
      // 执行环境定义目录
      await this.run(type, ["install"], {
        cwd: this.targetDir,
      });
      await this.run('git', ["init"], {
        cwd: this.targetDir,
      });
      console.log(chalk.green(`${this.name}项目构建成功`));
      console.log(chalk.green(`cd ${this.name}进入项目`));
    } catch (err) {
      console.error(chalk.red(err.stack), {
        ...err,
      });
    }
  }
};
