const ENV = process.env.FEUP_ENV;

function sourceMapConfig(isEnvProduction, { sourceMap = false }) {
  const result = {
    useSourceMap: true,
    options: {},
    // TODO: 待扩展
    // useJSSourceMap: false,
    // useCSSSourceMap: false,
  };
  // 如果当前环境为生产环境的 prod，直接不启用 sourceMap
  if (isEnvProduction && ENV === "prod") {
    result.useSourceMap = false;
    return result;
  }
  // 直接应用sourceMap
  if (typeof sourceMap === "boolean") {
    result.useSourceMap = sourceMap;
    return result;
  }
  if (Object.prototype.toString.call(sourceMap) !== "[object Object]") {
    const typeError = require("chalk").red(
      "sourceMap is not object or boolean in feup.config.js"
    );
    throw new TypeError(typeError);
  }
  // 如果当前环境配置为false，则直接全部不启用
  if (sourceMap[ENV] === false) {
    result.useSourceMap = false;
    return result;
  }
  // 解构各环境配置
  const { dev, test, pre, prod, ...props } = sourceMap;
  return {
    ...result,
    options: {
      ...result.options,
      ...props,
      ...(sourceMap.ENV || {}),
    },
  };
}

module.exports = sourceMapConfig;
