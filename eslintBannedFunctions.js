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
module.exports = {
    bannedFunctions,
    bannedProperties,
};
