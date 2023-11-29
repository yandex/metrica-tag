# Metrica tag
This repository contains source code for Metrica tag. Once built the tag can be placed on a web page, where after initialization it starts gathering analytics information about the page usage.

The codebase contains most of the features of the tag delivered by Metrica with exception for some proprietary stuff. Modular code allows for easily inclusion/exclusion of any feature, thus providing a way to achieve required balance between amount of collected data (affecting analytics quality) and script size.

## Documentation
For documentation about Metrica, please visit our website:
[JS API](https://yandex.ru/support/metrika/code/counter-initialize.xml)

## Usage
### Installation
The project is based on [nodejs](https://nodejs.org/en/).

If [nvm](http://nvm.sh) installed, you can run this command to install and use the required version of the nodejs.
```bash
nvm install
```

To install dependencies use the following command:
```
npm ci
```

### Build
The project contains a single build target output into `_build/public/watch.js` file. To build it run:
```sh
npm run build
```

The code is build for web and by default is uglified in order to achieve smaller size. If needed (e.g. for debugging purpose) the script can be build without uglification:
```sh
npm run build:raw
```

### Features
The code consists of basic code (always included into the build) and a collection of features. The features are listed in the [features.json](./features.json) file. By default all features are included (except for those which are explicitly marked as disabled). In order to exclude a feature from the build add a `"disabled": true` attribute. By enabling/disabling certain features the build can be tweaked to include only the desired capabilities.

## Development
### Add a feature
All the features listed in [features.json](./features.json) can be divided into two distinct types:
- A feature adding a large amount of code with isolated functionality (e.g. provider, middleware, transport, etc.). This is the main mechanism for adding new functionality. Those features usually have defined "path" field in their description object.
- A feature adding a small code block into an existing functions in order to enhance its behavior. Mostly used for small experiments and allows to add/exclude code, e.g. for a local testing build.

In order to add a new provider, do the following:
1. Add a feature to the [features.json](./features.json) file in the following format:
```js
{
    "code": "SOME_NEW_FEATURE", // The name of generated variable to be used in code.
    "path": "someNewProvider", // The path to the folder within src/providers with the module that defined the new provider.
    "desc": "Any meaningful description goes here",
    "disabled": true, // Set only if you want to exclude a feature from build.
    "exp": true, // A semantic attribute indicating an experimental feature. Doesn't affect the build process.
    "weight": 1000, /* A feature weight; defaults to 0 if not specified.
        Used for sorting features within feature initialization code in ascending order
        (the lower the weight, the earlier the provider initializes).
        Used for predictable initialization order.
        For example see the STACK_PROXY_FEATURE that must be initialized in the very end. */
},
```
1. Generate new feature set by running:
```sh
npm run features
```
2. Create a folder within `src/providers`.
    - The `index.ts` should contain only the initialization code and extensions to existing types. The file must export an `initProvider` function:
```typescript
export const initProvider = () => {
    /* The code is wrapped by a feature flag.
       If the feature is not included into a build, the code is cut off by rollup.
       The resultant empty function is cut off as well */
    if (flags[SOME_NEW_FEATURE]) {
        // Required code
        providersSync.push(someNewProvider);

        // Optional code for any additional setup
        addMiddlewareForProvider(SOME_NEW_PROVIDER, watchSyncFlags(), 1);
        providerMap[SOME_NEW_PROVIDER] = useSenderWatch;
        nameMap[SOME_NEW_PROVIDER] = fullList;
    }
};
```
    - The provider itself and all the utility code is put into separate files within the provider folder.
3. Write the provider code.
4. Write the test in the `__tests__` folder. Use `.spec.ts` extension.

### Tests
For test coverage the following packages are used:
- `mocha` - test runner;
- `sinon` - stubs;
- `chai` - assertions.

#### Stubs
`sinon` is used for stubbing functions within tests. In order to provide the best TypeScript experience make sure all stubs are assigned proper types, but do not include too much detail about stubbed function. Prefer the code style as follows:
```typescript
import * as sinon from 'sinon';
import defer from 'src/utils/defer';

describe('test', () => {
    const sandbox = sinon.createSandbox();
    let setDeferStub: sinon.SinonStub<
        Parameters<typeof defer.setDefer>,
        ReturnType<typeof defer.setDefer>
    >

    beforeEach(() => {
        setDeferStub = sandbox.stub(defer, 'setDefer');
    });
```
