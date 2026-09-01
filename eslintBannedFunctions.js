/* global module */
const defaultRestrictedProperties = [
    'error',
    {
        object: 'arguments',
        property: 'callee',
        message: 'arguments.callee is deprecated',
    },
    {
        object: 'global',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead',
    },
    {
        object: 'self',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead',
    },
    {
        object: 'window',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead',
    },
    {
        object: 'global',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead',
    },
    {
        object: 'self',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead',
    },
    {
        object: 'window',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead',
    },
    {
        property: '__defineGetter__',
        message: 'Please use Object.defineProperty instead.',
    },
    {
        property: '__defineSetter__',
        message: 'Please use Object.defineProperty instead.',
    },
    {
        object: 'Math',
        property: 'pow',
        message: 'Use the exponentiation operator (**) instead.',
    },
];
const bannedFunctions = [
    2,
    // Array
    {
        name: 'from',
        message: 'Use arrayFrom from utils',
    },
    // timeout
    {
        name: 'setTimeout',
        message: 'use setDefer from utils',
    },
    {
        name: 'clearTimeout',
        message: 'use clearDefer from utils',
    },
    // Promise
    {
        name: 'Promise',
        message: 'use PolyPromise from utils',
    },
    // Map
    {
        name: 'Map',
        message: 'use PolyMap from src/utils/map',
    },
    // Set
    {
        name: 'Set',
        message: 'use PolySet from from src/utils/set',
    },
];
const bannedProperties = [
    // String
    {
        name: 'toString',
        message: 'Use convertToString from utils',
    },
    {
        name: 'repeat',
        message: 'Use repeat from utils',
    },
    {
        name: 'trim',
        message: 'Use trimText from utils',
    },
    {
        name: 'padStart',
        message: 'Use padStart from utils',
    },
    {
        name: 'padEnd',
        message: 'Use padEnd from utils',
    },
    {
        name: 'startsWith',
        message: 'Use startsWith from utils',
    },
    // Array
    {
        name: 'map',
        message: 'Use cMap from utils',
    },
    {
        name: 'forEach',
        message: 'Use cForEach from utils',
    },
    {
        name: 'filter',
        message: 'Use cFilter from utils',
    },
    {
        name: 'sort',
        message: 'Use cSort from utils',
    },
    {
        name: 'find',
        message: 'Use cFind from utils',
    },
    {
        name: 'reduce',
        message: 'Use cReduce from utils',
    },
    {
        name: 'join',
        message: 'Use arrayJoin from utils',
    },
    {
        name: 'some',
        message: 'Use cSome from utils',
    },
    {
        name: 'every',
        message: 'Use cEvery from utils',
    },
    {
        name: 'reverse',
        message: 'Use cReverse from utils',
    },
    // Function
    {
        name: 'bind',
        message: 'Use bind, bindArg or bindArgs functions from utils',
    },
    // Mixed
    {
        name: 'indexOf',
        message:
            'Use cIndexOf from utils for arrays and stringIndexOf for strings',
    },
    {
        name: 'includes',
        message:
            'Use includes from utils for arrays and stringIncludes for strings',
    },
].map((f) => ({ property: f.name, message: f.message }));

/**
 * Restricted syntax that bans the spread operator for shallow copying
 * of objects. Rest parameters (e.g. `function f(...rest) {}` or
 * `const [a, ...rest] = arr`) and joining arrays are available.
 */
const bannedSpreadSyntax = [
    {
        selector: 'ObjectExpression > SpreadElement',
        message:
            'Spread for shallow object copy is not allowed. Use mix from src/utils/object instead.',
    },
];

/**
 * Restricted syntax that bans dynamic `import()` expressions,
 * both as runtime calls (`import('./x').then(...)`) and as type-level
 * references (`import('./x').Type` in type positions).
 */
const bannedDynamicImportSyntax = [
    {
        selector: 'ImportExpression',
        message:
            'Dynamic import() is not allowed. Use a top-level static import instead.',
    },
    {
        selector: 'TSImportType',
        message:
            'Dynamic import() type is not allowed. Use a top-level static type import instead.',
    },
];

module.exports = {
    bannedFunctions,
    bannedProperties,
    bannedSpreadSyntax,
    bannedDynamicImportSyntax,
    defaultRestrictedProperties,
};
