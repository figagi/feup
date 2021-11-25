
const readJson =  require('./utils/readJson')
const path =  require('path')
const fn = () => {
    let commander = require('commander').program
    commander.version(readJson(path.resolve(__dirname,'../package.json')).version)
    commander.command('-m xx -e xx').description('运行项目-m 指定模式 -e 指定环境')
    commander.command('new').description('创建新项目')
    // commander.command('lint').description('修复并检查格式')
    commander.parse(process.argv);
}

module.exports = fn