// const Log = require('@kkb/fig-log');
const chalk = require('chalk');
const dayjs = require('dayjs');
const got = require('got');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const getUserInfo = require('./getUserInfo');
const packageJson = require('../package.json');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const appNodeModules = resolveApp('node_modules')

const cliPackJson = require(resolveApp('node_modules')+`/feup${packageJson.testName || ''}/package.json`);

const deviceId = machineIdSync();

const default_APPID = '7642f6df02574b2ea9dfe2249ec67c92';

class ReportPlugin {
  constructor({ env, mode, diy = false, ...props }) {
    this.env = env;
    this.mode = mode;
    this.props = props;
    // 执行状态
    this.status = false;
    if (!diy) this.init();
  }

  async init() {
    try {
      // const response = await got('https://ali-cyb-cdn.kaikeba.com/chanyan/fig/run.json').json();
      // // 替换optinal chaining
      // let app_id = default_APPID;
      // if (
      //   typeof response === 'object' &&
      //   typeof response.report === 'object' &&
      //   response.report.app_id
      // ) {
      //   app_id = response.report.app_id;
      // }
      // Log.init({
      //   app_id,
      //   env: this.env,
      // });
    } catch ({ message }) {
      console.error(' ');
      console.error(chalk.red.dim(`获取配置失败！`));
      console.error(chalk.red.dim(`Error: ${message}`));
      process.exit(1);
    }
  }

  report(status) {
    if (this.status) {
      return;
    }
    const { startTime, config } = this.props;
    const endTime = new Date().getTime();
    const totalTime = (endTime - startTime) / 1000;
    console.info(
      ` ${chalk.red(config.name)} 项目 ${chalk.cyan(
        `构建 ${this.env} 环境${status ? '成功' : '失败'},总共耗时:`,
      )} ${chalk.green(totalTime)} s`,
    );

    // 构建用户信息
    const userInfo = getUserInfo();
    let userInfoData = [];
    if (userInfo.name || userInfo.email) {
      userInfoData = [
        {
          name: 'git用户',
          value: userInfo.name || '',
        },
        {
          name: '用户邮箱',
          value: userInfo.email || '',
        },
      ];
    }

    const params = {
      type: 'buildTime',
      notice: true,
      other: {
        mode: this.mode,
        app_name: config.name,
        time: totalTime,
        status,
        msg: [
          ...userInfoData,
          {
            name: 'cli版本',
            value: cliPackJson.version,
          },
          {
            name: '设备ID',
            value: deviceId,
          },
          {
            name: '开始时间',
            value: dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
          }, // 自定义：我是自定义内容
          {
            name: '结束时间',
            value: dayjs(endTime).format('YYYY-MM-DD HH:mm:ss'),
          },
        ].filter(Boolean),
      },
    };
    this.status = true;
    // Log.report(params)
    //   .then((res) => {
    //     // 调试用
    //     // console.log("success", res);
    //   })
    //   .catch((...err) => {
    //     // 调试用
    //     // console.error("catch", ...err);
    //   });
  }

  apply(compiler) {
    compiler.hooks.done.tapAsync('ReportPlugin', (compilation, callback) => {
      this.report(true);
      callback();
    });
    compiler.hooks.failed.tap('ReportPlugin', (compilation) => {
      this.report(false);
    });
  }
}

module.exports = ReportPlugin;
