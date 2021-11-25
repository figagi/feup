const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const LodashModuleReplacementPlugin = require("lodash-webpack-plugin");

module.exports = (configEnv) => {
  const { ANA_TYPE } = configEnv;

  return [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new LodashModuleReplacementPlugin({
      collections: true,
      // 解决第三方包lodash方法调用文件错乱问题，
      paths: true,
    }),
    ANA_TYPE && new BundleAnalyzerPlugin(),
  ].filter(Boolean);
};
