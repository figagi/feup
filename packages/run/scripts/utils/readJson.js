var fs = require('fs');

/**
 * @author Hank
 * @description 读取json
 */
function getPackageJson(path) {
//   console.log('1.开始读取package.json')
  var _packageJson = fs.readFileSync(path)
//   console.log('读取package.json文件完毕')
  return JSON.parse(_packageJson)
}
var cbDataPackage = getPackageJson



module.exports = cbDataPackage