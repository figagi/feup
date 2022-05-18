# 愿景
解决前端所有业务场景，及快速搭建、监控。

当公司选型react为生态的时候，如果你不想使用umi的时候，可以试用一下 FEUP

## 特性

- 钉钉通知 buildTime
- configureWebpack
- pxtorem 参数整合
- 脚手架生态「C端（spa）、服务端渲染框架（nextjs-up）、后台系统admin（已经集成基础布局，拿来即用）、小程序」
- 项目创建成功后初始化依赖
- 可配置化
- Server

<img width="809" alt="image" src="https://user-images.githubusercontent.com/9738969/169004706-8d832337-4326-48de-8be2-529d6a276a48.png">

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
- 发布到cdn



## LICENSE

feup-cli is open source software [licensed as MIT](LICENSE.md).
