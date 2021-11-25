# `feup-run`

> 主要服务于 `feup-cli`, 提供项目的构建打包功能

## Usage

```js
npm install feup-run
// 或
yarn add feup-run

require("feup-run")({ env, mode }, options);
```

| 参数名    | 类型   | 说明                                   |
| --------- | ------ | -------------------------------------- |
| `env`     | String | 可选项有：`dev`, `test`, `pre`, `prod` |
| `mode`    | String | 可选项有：`start`, `build`             |
| `options` | String | commander.action 提供的 options        |

## log

- 增加buildTime
## LICENSE

feup-cli is open source software [licensed as MIT](/LICENSE.md).
