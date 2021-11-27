#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const minimist = require('minimist');
const figlet = require('figlet');
const { version, testName } = require('../package.json');
// const stripComments = require('strip-json-comments');
// const pkg = JSON.parse(
//   stripComments(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8').replace(/^\ufeff/u, '')),
// );

const runPackName = `feup-run${testName || ''}`;

function printBanner(logger) {
  figlet.text(
    'FEUP',
    {
      font: '3D-ASCII',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    },
    (err, data) => {
      if (err) {
        // logger.error(err);
        // process.exit(2);
      }
      console.info(`\n${data}`);
      console.info(`FEUP，current version: v1, homepage: https://github.com/feupjs/feup`);
      console.info(
        ' (c) powered by FEUP JS, aims to improve front end workflow.                                       ',
      );
      console.info(' Run feup --help to see usage.                                     ');
    },
  );
}

program
  .command('stark')
  .description('create a new project powered by feup')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .action((name, options) => {
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.info(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored.",
        ),
      );
    }
    // --git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true;
    }
    require('feup-create')(name, options);
  });

program
  .command('create <app-name>')
  .description('create a new project powered by feup')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .action((name, options) => {
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.info(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored.",
        ),
      );
    }
    // --git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true;
    }
    require('feup-create')(name, options);
  });

program
  .command('run')
  .description('start project server')
  .option('-e, --env <env>', 'Overwrite target directory if it exists')
  .option('-m, --mode <mode>', 'Overwrite target directory if it exists')
  .action((...args) => require(runPackName)(...args));

// program
//   .command("init")
//   .description("init project config file")
//   .action(require("../lib/init"));

program.version(`v${version}`, '-v, --version');

program.on('command:*', ([cmd]) => {
  program.outputHelp();
  console.info(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  console.info();
  // suggestCommands(cmd);
  process.exitCode = 1;
});

program.commands.forEach((c) => c.on('--help', () => console.info()));

program.on('--help', () => {
  console.info();
  console.info(`  Run ${chalk.cyan(`feup <command> --help`)} for detailed usage of given command.`);
  console.info();
});


if(minimist(process.argv.slice(2))._.length == 0){
  printBanner()
}else{
  program.parse(process.argv);
}
