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
  default: function* (fly) {
    yield fly.serial(['build']);
  }

  , clean: function* (fly) {
    yield fly.clear(['build', 'coverage']);
  }

  , superclean: function* (fly) {
    fly.parallel(['clean']);
    yield fly.clear(['dist'])
  }

  , mrproper: function* (fly) {
    fly.parallel(['superclean']);
    yield fly.clear(['node_modules'])
  }

  , build: function* (fly) {
    let tsopts = getJSON('./tsconfig.json');

    yield fly.source("src/**/*.ts")
      .typescript(tsopts)
      .target("build/src")
  }

  , dist: function* (fly) {
    if (!fs.existsSync('Manifest.json')) {
      // A simple module, We just need to build 
      // and move the result to dist
      yield fly.serial(['build'])
        .source(['build/src/**/*.js'])
        .target('dist')
      return
    }
    // We should distinguish the various cases here

    let name = getJSON('package.json').name;

    yield fly.serial(['build'])
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

  , spec: function* (fly) {
    yield fly.source("./test/**/*.jest.ts")
      .shell({
        cmd: 'jest --coverage $glob',
        preferLocal: true,
        glob: true
      })
  }

  , lint: function* (fly) {
    yield fly.source('./{src,test}/**/*.ts')
      .shell('tslint $glob')
  }

  , installer: function* (fly) {
    yield fly.source('./package.json')
      .target('./build')
      .source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component/build && rm -rf ./node_modules && npm install --production"`)
      .source('static/**/*')
      .target('build/static')
  }

  , devinstall: function* (fly) {
    yield fly.source("./Manifest.json")
      .run({ every: true }, dockerImage)
      .shell(`docker run --rm -t --entrypoint=bash -v $PWD:/tmp/component "$file" -c "cd /tmp/component && npm install"`)
  }
  
  , register: function* (fly) {
      yield fly.source('./dist/bundle.zip')
        .shell('curl -s http://localhost:8090/admission/bundles -F bundlesZip=@$file')
  }
}

function loadPlugin(fly, plug) {
  if (isObject(plug)) {
    fly.plugin(plug)
  } else {
    plug(fly)
  }
}

var isObject =
  val => Boolean(val) && (val.constructor === Object)

function plugin(fly, _, utils) {
  // Load common plugins
  loadPlugin(fly, require('fly-clear'))
  loadPlugin(fly, require('fly-mocha'))
  loadPlugin(fly, require('fly-shell'))
  loadPlugin(fly, require('fly-typescript'))
  loadPlugin(fly, require('fly-watch'))
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
 * fly-kumori includes a number of fly plugins
 * (the ones needed to implement its predefined tasks)
 * 
 * If you write a task with the same name as one of the predefined tasks,
 * your task will override it.
 */

module.exports = tasks;
