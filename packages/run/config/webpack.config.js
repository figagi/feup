const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const resolve = require('resolve');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const ManifestPlugin = require('webpack-manifest-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ESLintPlugin = require('eslint-webpack-plugin');

const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');
const postcssPlugins = require('./postcssPlugins');
const commonPlugins = require('./commonPlugins');
const sourceMapConfig = require('./sourceMapConfig');

const appPackageJson = require(paths.appPackageJson);

const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const isBuildProd = process.env.FEUP_ENV === 'prod';

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000', 10);

const useTypeScript = fs.existsSync(paths.appTsConfig);

const systemName = appPackageJson.name;

// Get the path to the uncompiled service worker (if it exists).
const { swSrc } = paths;

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const stylRegex = /\.styl$/;
const stylModuleRegex = /\.module\.styl$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

const figConfig = require('../scripts/utils/loadFigConfig')() || {};

const userWebpackConfig = figConfig.webpackConfig || {};

// echo self deviceId, use reportPlugins and inject DefinePlugin
const { machineIdSync } = require('node-machine-id');

const deviceId = machineIdSync();
console.info(`You device id is: ${deviceId}`);

const merge = require('webpack-merge');

function webpackConfig(webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  // 按需配置SourceMap
  const { useSourceMap } = sourceMapConfig(isEnvProduction, figConfig);

  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const getStyleLoaders = (cssOptions, preProcessor, options) => {
    const loaders = [
      // 使用 MiniCssExtractPlugin 时，不应该存在 style-loader 链
      // 开发环境使用 style-loader
      // 生产环境使用 MiniCssExtractPlugin.loader
      isEnvProduction
        ? {
          loader: MiniCssExtractPlugin.loader,
          options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {},
        }
        : require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: () => postcssPlugins(process.env),
          sourceMap: useSourceMap,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: useSourceMap,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: { ...options, sourceMap: true, javascriptEnabled: true },
        },
      );
    }
    return loaders;
  };
  const devtoolMap = {
    development: {
      true: 'cheap-module-source-map',
      false: 'cheap-module-source-map',
    },
    production: {
      true: 'source-map',
      false: 'none',
    },
  };
  const defaultConfig = {
    mode: webpackEnv,
    bail: isEnvProduction,
    devtool: devtoolMap[webpackEnv][useSourceMap.toString()],
    entry: [
      isEnvDevelopment && require.resolve('react-dev-utils/webpackHotDevClient'),
      paths.appIndexJs,
    ].filter(Boolean),
    output: {
      path: isEnvProduction ? paths.appBuild : undefined,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
      futureEmitAssets: true,
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : isEnvDevelopment &&
        ((info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
      // https://github.com/umijs/qiankun/issues/574
      // webpack 默认的 globalObject 值是 'window'，通常不配就行，如果改成了 'this' 会导致沙箱泄露，从而导致不同实例共用了同一个 chunk 运行时，而前一个运行时因为卸载后 element 被置为 null，下一个实例因为还是在同一运行时里会直接使用前一个闭包中的 element，从而造成了报错
      globalObject: 'window',
      library: `${systemName}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${systemName}`,
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
          sourceMap: useSourceMap,
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: useSourceMap
              ? {
                inline: false,
                annotation: true,
              }
              : false,
          },
          cssProcessorPluginOptions: {
            preset: ['default', { minifyFontValues: { removeQuotes: false } }],
          },
        }),
      ],
      // scaffold-react
      splitChunks: {
        chunks: 'async',
        minSize: 0,
        maxSize: 1024 * 800,
        maxAsyncRequests: 6, // 最大的异步请求数
        maxInitialRequests: 6,
        name: true,
        cacheGroups: {
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 0,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `${packageName.replace('@', '')}`;
            },
            minChunks: 2,
          },
        },
      },
      // spa
      // splitChunks: {
      //   chunks: "all",
      //   name: false,
      // },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },
    resolve: {
      modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
      extensions: paths.moduleFileExtensions
        .map((ext) => `.${ext}`)
        .filter((ext) => useTypeScript || !ext.includes('ts')),
      alias: {
        'react-native': 'react-native-web',
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        ...(modules.webpackAliases || {}),
        src: paths.appSrc,
        utils: paths.appUtils,
        views: paths.appViews,
        consts: paths.appConsts,
        components: paths.appComponents,
        '@': paths.appSrc,
      },
      plugins: [PnpWebpackPlugin, new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
    module: {
      strictExportPresence: true,
      rules: [
        { parser: { requireEnsure: false } },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: imageInlineSizeLimit,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                babelrc: false,
                configFile: false,
                presets: [
                  [
                    require.resolve('@babel/preset-env'),
                    {
                      targets: figConfig.targets || {
                        browsers: ['ie >=10', 'last 2 version', '> 5%', 'not dead'],
                      },
                      modules: false,
                      loose: true,
                    },
                  ],
                  require.resolve('babel-preset-react-app'),
                ],
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction ? 'production' : isEnvDevelopment && 'development',
                  [
                    'babel-plugin-named-asset-import',
                    'babel-preset-react-app',
                    'react-dev-utils',
                    'react-scripts',
                  ],
                ),
                plugins: [
                  ['@babel/plugin-proposal-private-methods', { loose: true }],
                  [require.resolve('@babel/plugin-syntax-jsx')],
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                        },
                      },
                    },
                  ],
                  // antd按需加载
                  [
                    require.resolve('babel-plugin-import'),
                    {
                      libraryName: 'antd',
                      libraryDirectory: 'es',
                      style: true,
                    },
                    'antd',
                  ],
                  // 清log
                  isBuildProd && [
                    require.resolve('babel-plugin-transform-remove-console'),
                    { exclude: ['info', 'error', 'warn'] },
                  ],
                  require.resolve('@babel/plugin-proposal-object-rest-spread'),
                  require.resolve('@babel/plugin-syntax-dynamic-import'), // 动态导入
                  require.resolve('@babel/plugin-syntax-import-meta'),
                  require.resolve('@babel/plugin-proposal-function-sent'), // 转换成es5
                  [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
                  require.resolve('@babel/plugin-proposal-export-namespace-from'),
                  // 转换语法处理
                  require.resolve('@babel/plugin-transform-destructuring'), // 结构赋值
                  require.resolve('@babel/plugin-transform-arrow-functions'), // 箭头函数
                  require.resolve('@babel/plugin-transform-async-to-generator'), // 二个插件解决async语法问题
                  require.resolve('@babel/plugin-transform-regenerator'),
                  require.resolve('@babel/plugin-proposal-numeric-separator'),
                  require.resolve('@babel/plugin-proposal-throw-expressions'),
                  require.resolve('@babel/plugin-transform-template-literals'), // 字符串模板
                ].filter(Boolean),
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            {
              test: /\.(js|jsx|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [require.resolve('babel-preset-react-app/dependencies'), { helpers: true }],
                ],
                plugins: [
                  require.resolve('@babel/plugin-proposal-object-rest-spread'),
                  require.resolve('@babel/plugin-syntax-dynamic-import'), // 动态导入
                  require.resolve('@babel/plugin-syntax-import-meta'),
                  require.resolve('@babel/plugin-proposal-function-sent'), // 转换成es5
                  [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
                  require.resolve('@babel/plugin-proposal-export-namespace-from'),
                  // 转换语法处理
                  require.resolve('@babel/plugin-transform-destructuring'), // 结构赋值
                  require.resolve('@babel/plugin-transform-arrow-functions'), // 箭头函数
                  require.resolve('@babel/plugin-transform-async-to-generator'), // 二个插件解决async语法问题
                  require.resolve('@babel/plugin-transform-regenerator'),
                  require.resolve('@babel/plugin-proposal-numeric-separator'),
                  require.resolve('@babel/plugin-proposal-throw-expressions'),
                  require.resolve('@babel/plugin-transform-template-literals'), // 字符串模板
                ],
                cacheDirectory: true,
                cacheCompression: false,
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction ? 'production' : isEnvDevelopment && 'development',
                  [
                    'babel-plugin-named-asset-import',
                    'babel-preset-react-app',
                    'react-dev-utils',
                    'react-scripts',
                  ],
                ),
                sourceMaps: useSourceMap,
                inputSourceMap: useSourceMap,
              },
            },
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: useSourceMap,
              }),
              sideEffects: true,
            },
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: useSourceMap,
                modules: {
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
            },
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: useSourceMap,
                },
                'sass-loader',
              ),
              sideEffects: true,
            },
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: useSourceMap,
                  modules: {
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'sass-loader',
              ),
            },
            {
              test: stylRegex,
              exclude: stylModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: useSourceMap,
                },
                'stylus-loader',
              ),
              sideEffects: true,
            },
            {
              test: stylModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: useSourceMap,
                  modules: {
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'stylus-loader',
              ),
            },
            {
              test: lessRegex,
              exclude: lessModuleRegex,
              use: [
                ...getStyleLoaders(
                  {
                    importLoaders: 2,
                    sourceMap: useSourceMap,
                  },
                ),
                {
                  loader: require.resolve('less-loader'),
                  options: {
                    lessOptions: {
                      javascriptEnabled: true,
                      modifyVars: {
                        '@ant-prefix': systemName,
                      },
                    },
                    sourceMap: useSourceMap,
                  },
                },
              ],
              sideEffects: true,
            },
            {
              test: lessModuleRegex,
              use: [
                ...getStyleLoaders(
                  {
                    importLoaders: 2,
                    sourceMap: useSourceMap,
                    modules: {
                      getLocalIdent: getCSSModuleLocalIdent,
                    },
                  },
                ),
                {
                  loader: require.resolve('less-loader'),
                  options: {
                    lessOptions: {
                      javascriptEnabled: true,
                      modifyVars: {
                        '@ant-prefix': systemName,
                      },
                    },
                    sourceMap: useSourceMap,
                  },
                },
              ],
            },
            {
              loader: require.resolve('file-loader'),
              exclude: [/\.(js|mjs|jsx|ts|tsx|scss|less|styl)$/, /\.html$/, /\.json$/],
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new ESLintPlugin({
        context: __dirname, // 指示文件根的字符串
        files: paths.appSrc, // 监听的文件目录，eslintrc使用项目中自带的
        exclude: [], // String|Array[String] default node_modules 指定要排除的文件和/或目录。 必须相对于options.context.
        // formatter: require.resolve("react-dev-utils/eslintFormatter"),
        eslintPath: require.resolve('eslint'), // eslint实例位置
        extensions: ['js', 'jsx', 'ts', 'tsx'],
        fix: false, // 不开启自动修复
      }),
      new WebpackBar({
        name: 'FEUP',
        color: '#00AFF2',
        profile: true,
        minimal: false,
        compiledIn: false,
      }),
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
        CONFIG: {
          FEUP_ENV: process.env.FEUP_ENV,
        },
        ...(isEnvProduction
          ? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }
          : undefined),
      }),
      // 将<script>注入到index.html
      isEnvProduction &&
      shouldInlineRuntimeChunk &&
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // 允许在index.html中添加变量
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // 检测模块
      new ModuleNotFoundPlugin(paths.appPath),
      // 注入变量
      new webpack.DefinePlugin({
        ...env.stringified,
        systemName: JSON.stringify(systemName),
        figDeviceId: JSON.stringify(deviceId),
      }),
      // 完全启用HMR
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // 如果路径有误则直接报错
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // 允许你安装库后自动重新构建打包文件
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      // 抽离CSS, 开发环境默认启用，但是根据环境不同，进行命名区分
      new MiniCssExtractPlugin({
        filename: isEnvDevelopment ? '[name].css' : 'static/css/[name].[contenthash:8].css',
        chunkFilename: isEnvDevelopment ? '[id].css' : 'static/css/[id].[contenthash:8].chunk.css',
      }),
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            const newManifest = manifest;
            newManifest[file.name] = file.path;
            return newManifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter((fileName) => !fileName.endsWith('.map'));

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // IgnorePlugin move commonPlugin
      // https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#full_generatesw_config
      isEnvProduction &&
      fs.existsSync(swSrc) &&
      new GenerateSW({
        clientsClaim: true,
        exclude: [/\.map$/, /asset-manifest\.json$/],
        // https://developers.google.com/web/tools/workbox/guides/using-bundlers#moving_from_importscripts_to_module_imports
        // https://developers.google.com/web/tools/workbox/modules/workbox-sw
        // importWorkboxFrom: "cdn", // 新版本替换
        navigateFallback: `${paths.publicUrlOrPath}index.html`,
        navigateFallbackDenylist: [new RegExp('^/_'), new RegExp('/[^/?]+\\.[^/]+$')],
      }),
      useTypeScript &&
      new ForkTsCheckerWebpackPlugin({
        typescript: resolve.sync('typescript', {
          basedir: paths.appNodeModules,
        }),
        async: isEnvDevelopment,
        useTypescriptIncrementalApi: true,
        checkSyntacticErrors: true,
        resolveModuleNameModule: process.versions.pnp ? `${__dirname}/pnpTs.js` : undefined,
        resolveTypeReferenceDirectiveModule: process.versions.pnp
          ? `${__dirname}/pnpTs.js`
          : undefined,
        tsconfig: paths.appTsConfig,
        reportFiles: [
          '**',
          '!**/__tests__/**',
          '!**/?(*.)(spec|test).*',
          '!**/src/setupProxy.*',
          '!**/src/setupTests.*',
        ],
        silent: true,
        formatter: isEnvProduction ? typescriptFormatter : undefined,
      }),
      ...commonPlugins(process.env),
    ].filter(Boolean),
    node: {
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      http2: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    performance: false,
  };
  return merge(
    defaultConfig,
    userWebpackConfig,
    isEnvProduction
      ? {
        externals: {
          moment: 'moment',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      }
      : {},
  );
};

module.exports = webpackConfig;
