# Changelog

## v1.0.5

Bug fix. Now the template is checked before creating the new element folder in the workspace.
Templates has been changed to remove temporary and dependency folders after building the final distributable zip.
Now this library depends only on npm targets 'devinit', 'superclean' y 'dist'.

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
