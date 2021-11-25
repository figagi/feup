const fs = require("fs");
const path = require("path");
const postcssNormalize = require("postcss-normalize");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const defaultOptions = {
  include: [],
};

const pxToRemOptions = {
  ...defaultOptions,
  ...(require("../scripts/utils/loadFigConfig")().pxtorem || {}),
};

const postcssPlugins = (configEnv) => {
  return [
    require("postcss-flexbugs-fixes"),
    require("postcss-preset-env")({
      autoprefixer: {
        flexbox: "no-2009",
      },
      stage: 3,
    }),
    // 编译转换css成rem
    require("fig-pxtorem")({
      rootValue: 16,
      selectorBlackList: ["weui", "mu", "ant"], // 忽略转换正则匹配项（选择器）
      unitPrecision: 5,
      mediaQuery: true,
      minPixelValue: 0,
      propList: [
        "*background*",
        "*padding*",
        "*margin*",
        "letter-spacing",
        "*width",
        "*height",
        "left",
        "font*",
        "right",
        "top",
        "bottom",
      ],
      ...pxToRemOptions,
      include: pxToRemOptions.include.map((item) => resolveApp(item)),
    }),
    postcssNormalize(),
  ];
};

module.exports = postcssPlugins;
