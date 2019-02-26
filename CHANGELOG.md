# Changelog

## v1.1.8

Dependencies. Updated dependencies.

## v1.1.7

Dependencies. Updated dependencies.

## v1.1.6

Dependencies. Updated dependencies.

## v1.1.5

Dependencies. Updated dependencies.

## v1.1.4

Bug fixed. New services can be deployed using kumori cli even if the related service application is not in the workspace as soon as it is already registered in the target stamp.

## v1.1.3

Updated dependencies.

## v1.1.0

Bug fix. Now the template is checked before creating the new element folder in the workspace.
Now this library depends only on npm targets 'devinit', 'superclean' y 'dist'.
Changed `@kumori/runtime` dependency to 1.1.1.
Templates moved to their own repository (https://github.com/kumori-systems/generator-workspace) and mutated to be [yeoman](http://yeoman.io) generators.
Defined a interface StampStub to decouple the workspace lib of @kumori/admission-client.
Added utilities to add projects. A project populates the workspace with a set of elements, typically some components and a service.
Now templates are also used to initialize a workspace.

## v1.0.4

Templates updated to avoid the problems related with package-lock.json when `kumori component build` is executed twice.

## v1.0.3

Now `kumori component deploy` creates inbounds with random domains by default for each provided service channels. This behaviour can be disabled with the `--skip-inbounds` flag.
Added templates for the `hello-world` example used in the quick start guide.

## v1.0.2

Addedd runtime.install to install runtime images

## v1.0.1

Identical to 1.0.0. Patch version increased due to NPM repository problems.

## v1.0.0

Initial version. Not published due to NPM repository problems.
