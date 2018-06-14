const vm = require('vm');
const fs = require('fs');
const path = require('path');


// Gobble up a JSON file with comments
function getJSON(filepath) {
  const jsonString = "g = " + fs.readFileSync(filepath, 'utf8') + "; g";
  return (new vm.Script(jsonString)).runInNewContext();
}


function* componentManifest(file) {
  const tom = JSON.parse(file.data.toString('utf8'));
  file.base = path.parse(file.base).name + ".json";
  file.data = new Buffer(JSON.stringify(tom, null, 2));
}


function* codeManifest (file) {
  const manifest = JSON.parse(file.data.toString('utf8'));

  let codeManifest = {
    spec : "http://eslap.cloud/manifest/blob/1_0_0",
    name : manifest.code
  }

  file.base = path.parse(file.base).name + ".json";
  file.data = new Buffer(JSON.stringify(codeManifest, null, 2));
}

function* dockerImage(file) {
  let raw = JSON.parse(file.data.toString('utf8')).runtime.slice(8)
    , comps = raw.split('/')
    , version = comps.pop();

  comps.push('dev')
  file.base = comps.join('/') + ":" + version
  file.dir = ""
}

const tasks = {
  default: function* (task) {
    yield task.serial(['build']);
  }

  , clean: function* (task) {
    yield task.source('./package.json')
      .target('./build')
      .source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component && rm -rf build coverage"`)
      .source('static/**/*')
      .target('build/static')
}

  , superclean: function* (task) {
    task.parallel(['clean']);
    yield task.source('./package.json')
      .target('./build')
      .source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component && rm -rf node_modules"`)
      .source('static/**/*')
      .target('build/static')
  }

  , mrproper: function* (task) {
    task.parallel(['superclean']);
    yield task.source('./package.json')
      .target('./build')
      .source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component && rm -rf dist"`)
      .source('static/**/*')
      .target('build/static')
  }

  , build: function* (task) {
    yield task.source("src/**/*.js")
      .target("build/src")
  }

  , dist: function* (task) {
    if (!fs.existsSync('Manifest.json')) {
      // A simple module, We just need to build
      // and move the result to dist
      yield task.serial(['build'])
        .source(['build/src/**/*.js'])
        .target('dist')
      return
    }
    // We should distinguish the various cases here

    let name = getJSON('package.json').name;

    yield task.serial(['installer', 'build'])
      .source(['build/src/**/*.js'])
      .target(`dist/components/${name}/code/contents`)
      .source('build/node_modules')
      .shell(`cp -r $file dist/components/${name}/code/contents`)
      .source(['build/static'])
      .shell(`cp -r $file dist/components/${name}/code/contents`)
      .source('build/package.json')
      .target(`dist/components/${name}/code/contents`)
      .source(['Manifest.json'])
      .target(`dist/components/${name}`)
      .source(['Manifest.json'])
      .run({ every: true, files: true }, codeManifest)
      .target(`dist/components/${name}/code`)
      .shell('cd ./dist && zip -r bundle.zip components && rm -rf components')
  }

  , spec: function* (task) {
    yield task.source("./test/**/*.jest.js")
      .shell({
        cmd: 'jest --coverage $glob',
        preferLocal: true,
        glob: true
      })
  }

  , lint: function* (task) {
    yield task.source('./{src,test}/**/*.js')
      .shell('node-lint $glob --config config.json')
  }

  , installer: function* (task) {
    yield task.source('./package.json')
      .target('./build')
      .source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component/build && rm -rf ./node_modules && npm install --production"`)
      .source('static/**/*')
      .target('build/static')
  }

  , devinstall: function* (task) {
    yield task.source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component && npm install"`)
  }
}

function loadPlugin(task, plug) {
  if (isObject(plug)) {
    task.plugin(plug)
  } else {
    plug(task)
  }
}

var isObject =
  val => Boolean(val) && (val.constructor === Object)

function plugin(task, _, utils) {
  // Load common plugins
  loadPlugin(task, require('@task/shell'))
}

plugin.tasks = function () {
  return Object.create(tasks);
}

plugin.internals = {
    componentManifest: componentManifest
  , dockerImage: dockerImage
}

plugin.utils = {
  getJSON: getJSON
}

/**
 * Write your tasks like
 * task.mytask = ...
 *
 * task-kumori includes a number of task plugins
 * (the ones needed to implement its predefined tasks)
 *
 * If you write a task with the same name as one of the predefined tasks,
 * your task will override it.
 */

module.exports = tasks;
