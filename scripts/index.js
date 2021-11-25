const fs = require('fs');
const { exec } = require('child_process');
const runPack = require('../packages/run/package.json');
const cliPack = require('../packages/cli/package.json');

function jsonToStr(objData) {
  try {
    return JSON.stringify(objData, null, 2);
  } catch (error) {
    return '';
  }
}

// 主进程结束回调
function endCallback(name) {
  const tips = name ? `更换包名${name}` : '正式包名';
  exec(`git add . && git commit -m "feat: ${tips}"`, (err, stdout) => {
    // if (err) throw err;
    // console.info(stdout);
  });
}

const WRITE_TYPE = 'UTF8';
const betaName = '_beta';
const runPackName = 'feup-run';
const runPackBateName = runPackName + betaName;

const cliPackName = 'feup';
const cliPackBateName = cliPackName + betaName;

function mainJs() {
  const publishType = process.env.PUB_TYPE || 'beta';
  const runPackPath = `${__dirname}/../packages/run/package.json`;
  const cliPackPath = `${__dirname}/../packages/cli/package.json`;
  const runWriterStream = fs.createWriteStream(runPackPath);
  const cliWriterStream = fs.createWriteStream(cliPackPath);

  if (publishType === 'beta') {
    // run
    runPack.name = runPackBateName;
    runPack.testName = betaName;
    runWriterStream.write(jsonToStr(runPack), WRITE_TYPE);
    runWriterStream.end();

    // cli
    cliPack.name = cliPackBateName;
    cliPack.testName = betaName;
    cliPack.dependencies[runPackBateName] = cliPack.dependencies[runPackName] || runPack.version;
    delete cliPack.dependencies[runPackName];

    cliWriterStream.write(jsonToStr(cliPack), WRITE_TYPE);
    cliWriterStream.end();
    endCallback(betaName);
    return;
  }

  if (publishType === 'prod') {
    runPack.name = runPackName;
    runPack.testName = '';
    runWriterStream.write(jsonToStr(runPack), WRITE_TYPE);
    runWriterStream.end();
    // cli
    cliPack.name = cliPackName;
    cliPack.testName = '';
    cliPack.dependencies[runPackName] = cliPack.dependencies[runPackBateName] || runPack.version;
    delete cliPack.dependencies[runPackBateName];
    cliWriterStream.write(jsonToStr(cliPack), WRITE_TYPE);
    cliWriterStream.end();
    endCallback();
  }
}

mainJs();
