const vm = require ('vm');
const fs = require ('fs');

var pkg = require('./package.json');

// Gobble up a JSON file with comments
function getJSON(filepath) {
  const jsonString = "g = " + fs.readFileSync(filepath, 'utf8') + "; g";
  return (new vm.Script(jsonString)).runInNewContext();
}

exports.default = function * (task) {
  yield task.serial(['build']);
}

exports.clean = function * (task) {
  yield task.clear(['lib-test', 'coverage']);
}

exports.superclean = function * (task) {
  task.parallel(['clean']);
  yield task.clear(['lib'])
}

exports.mrproper = function * (task) {
  task.parallel(['superclean']);
  yield task.clear(['node_modules'])
}

// exports.build = function * (task) {
//   let tsopts = getJSON('./tsconfig.json')
//   yield task.source('src/**/*.ts')
//     .typescript(tsopts)
//     .target('lib')
// }

exports.build = function * (task) {
  yield task.source('./tsconfig.json')
    .shell({
      cmd: 'tsc -p $glob --outDir lib',
      preferLocal: true,
      glob: true
    })
}

exports.buildtest = function * (task) {
  let tsopts = getJSON('./tsconfig.json')
    ;

  yield task.serial(['build'])
    .source("test/**/*.ts")
    .typescript(tsopts)
    .target("lib-test")
}

exports.test = function * (task) {
  yield task.serial(['buildtest'])
    .source("./lib-test/**/*.test.js")
    .shell({
      cmd: 'mocha -u bdd --colors $glob',
      preferLocal: true,
      glob: true
    })
}

exports.lint = function * (task) {
  yield task.source('./{src,test}/**/*.ts')
    .shell('tslint $glob')
}
