# feup

## 详细文档

[简体中文](https://www.feup.cn)

## Usage

> 或配置 .npmrc 和 .yarnrc 后使用 npm install feup-cli 或 yarn add feup-cli 安装

如果要使用全局 `feup` 命令，需要在安装时安装到全局，即:

```sh
# 请根据自己的情况选择

# npm 全局
npm install -g feup

# yarn 全局
yarn global add feup
```

> try
```
feup
```

## Start

- `feup` `<command>` `<options>`

## Dev Start

- `git clone 项目`
- `node 项目路径/bin/feup.js` `<command>` `<options>`

## Command

- `create` `<project-name>`
  创建项目
- `init`
  初始化配置文件
- `run -e <env> -m <mode>`
  启动/打包项目
  > env: `[dev, test, pre, prod]`
  > mode: `[start, build]`

## TODO

> TODO 不分先后

- chainWebpack
- 分包
- 检测升级
- alias
- analyze
- devServer
- ignoreMomentLocale
- outputPath
- publicPath
- 考虑把 public/index.html 收入进去
- 生成注入组件
- 逐步增加配置项

## Done

- 钉钉通知 buildTime
- configureWebpack
- 通过塞伯坦来动态修改脚手架的仓库地址和分支
- pxtorem 参数整合
- 初始化后 git 仓库地址修改
- 通过命令行初始化模版「spa、ssr、miniProgram、kms」
- 项目创建成功后初始化依赖
- 可配置化
- Server

## LICENSE

feup-cli is open source software [licensed as MIT](LICENSE.md).
