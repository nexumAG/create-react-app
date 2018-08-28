// @remove-file-on-eject
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const spawn = require('react-dev-utils/crossSpawn');

module.exports = function(
  appPath,
  appName,
  verbose,
  originalDirectory,
  template
) {
  const ownPackageName = require(path.join(__dirname, '..', 'package.json'))
    .name;
  const ownPath = path.join(appPath, 'node_modules', ownPackageName);
  const appPackage = require(path.join(appPath, 'package.json'));
  const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

  // nexum: require .template.package.json
  const templatePackageJsonPath = path.join(
    __dirname,
    '..',
    'template',
    '.template.package.json'
  );
  let packageJson = null;
  if (fs.existsSync(templatePackageJsonPath)) {
    packageJson = require(templatePackageJsonPath);
  }

  // Copy over some of the devDependencies
  appPackage.dependencies = appPackage.dependencies || {};

  // nexum: add dependencies from .template.package.json
  if (packageJson) {
    Object.assign(appPackage.dependencies, packageJson.dependencies, packageJson.devDependencies);
  }

  // Setup the script rules
  appPackage.scripts = {
    start: 'react-scripts start',
    build: 'react-scripts build',
    test: 'react-scripts test --env=jsdom',
    eject: 'react-scripts eject',
  };

  // nexum: overwrite/add scripts from .template.package.json
  if (packageJson) {
    // scripts
    const templateScripts = packageJson.scripts;
    Object.assign(appPackage.scripts, templateScripts);
  }

  // nexum: more package.json features
  if (packageJson) {
    appPackage['jest'] = packageJson['jest'];
    appPackage['jest-junit'] = packageJson['jest-junit'];
    appPackage['eslint-junit'] = packageJson['eslint-junit'];
    appPackage['atomic-scripts'] = packageJson['atomic-scripts'];
  }

  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2)
  );

  const readmeExists = fs.existsSync(path.join(appPath, 'README.md'));
  if (readmeExists) {
    fs.renameSync(
      path.join(appPath, 'README.md'),
      path.join(appPath, 'README.old.md')
    );
  }

  // Copy the files for the user
  const templatePath = template
    ? path.resolve(originalDirectory, template)
    : path.join(ownPath, 'template');
  if (fs.existsSync(templatePath)) {
    fs.copySync(templatePath, appPath);
  } else {
    console.error(
      `Could not locate supplied template: ${chalk.green(templatePath)}`
    );
    return;
  }

  // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
  // See: https://github.com/npm/npm/issues/1862
  fs.move(
    path.join(appPath, 'gitignore'),
    path.join(appPath, '.gitignore'),
    [],
    err => {
      if (err) {
        // Append if there's already a `.gitignore` file there
        if (err.code === 'EEXIST') {
          const data = fs.readFileSync(path.join(appPath, 'gitignore'));
          fs.appendFileSync(path.join(appPath, '.gitignore'), data);
          fs.unlinkSync(path.join(appPath, 'gitignore'));
        } else {
          throw err;
        }
      }
    }
  );

  let command;
  let args;

  if (useYarn) {
    command = 'yarnpkg';
    args = ['add'];
  } else {
    command = 'npm';
    args = ['install', '--save', verbose && '--verbose'].filter(e => e);
  }
  args.push('react', 'react-dom');

  // nexum: Install additional template dependencies, if present
  if (packageJson) {
    // dependencies
    const templateDependencies = packageJson.dependencies;
    args = args.concat(
      Object.keys(templateDependencies).map(key => {
        return `${key}@${templateDependencies[key]}`;
      })
    );

    // devDependencies (for now install as normal dependency)
    const templateDevDependencies = packageJson.devDependencies;
    args = args.concat(
      Object.keys(templateDevDependencies).map(key => {
        return `${key}@${templateDevDependencies[key]}`;
      })
    );

    fs.unlinkSync(path.join(appPath, '.template.package.json'));
  }

  // Install react and react-dom for backward compatibility with old CRA cli
  // which doesn't install react and react-dom along with react-scripts
  // or template is presetend (via --internal-testing-template)
  if (!isReactInstalled(appPackage) || template) {
    console.log(`Installing react and react-dom using ${command}...`);
    console.log();

    const proc = spawn.sync(command, args, { stdio: 'inherit' });
    if (proc.status !== 0) {
      console.error(`\`${command} ${args.join(' ')}\` failed`);
      return;
    }
  }

  // Display the most elegant way to cd.
  // This needs to handle an undefined originalDirectory for
  // backward compatibility with old global-cli's.
  let cdpath;
  if (originalDirectory && path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  // Change displayed command to yarn instead of yarnpkg
  const displayedCommand = useYarn ? 'yarn' : 'npm';

  console.log();
  console.log(`Success! Created ${appName} at ${appPath}`);
  console.log('Inside that directory, you can run several commands:');
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} start`));
  console.log('    Starts the development server.');
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}build`)
  );
  console.log('    Bundles the app into static files for production.');
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} test`));
  console.log('    Starts the test runner.');
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}eject`)
  );
  console.log(
    '    Removes this tool and copies build dependencies, configuration files'
  );
  console.log(
    '    and scripts into the app directory. If you do this, you can’t go back!'
  );  
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}coverage`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}test:ci`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}lint`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}lint:fix`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}lint:ci`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}stylelint:ci`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}flow`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}flow:ci`)
  );
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}atomic`)
  );
  console.log(
    '    These scripts are added by nexum-react-scripts.'
  );
  console.log();
  console.log(`
  _ __   _____  ___   _ _ __ ___
 | '_ \ / _ \ \/ / | | | '_ ´  _ \
 | | | |  __/>  <| |_| | | | | | |
 |_| |_|\___/_/\_\\__,_|_| |_| |_|
  `);
  console.log();
  console.log('More info: https://github.com/nexumAG/create-react-app');
  console.log();
  console.log('We suggest that you begin by typing:');
  console.log();
  console.log(chalk.cyan('  cd'), cdpath);
  console.log('First install dependencies:');
  console.log(`  ${chalk.cyan(`${displayedCommand} install`)}`);
  console.log();
  console.log('Start dev server:');
  console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
  console.log();
  if (readmeExists) {
    console.log();
    console.log(
      chalk.yellow(
        'You had a `README.md` file, we renamed it to `README.old.md`'
      )
    );
  }
  console.log();
  console.log('Happy hacking!');
};

function isReactInstalled(appPackage) {
  const dependencies = appPackage.dependencies || {};

  return (
    typeof dependencies.react !== 'undefined' &&
    typeof dependencies['react-dom'] !== 'undefined'
  );
}
