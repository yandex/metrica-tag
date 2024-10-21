const bannedFunctions = [
    2,
    // String
    {
        name: 'toString',
        message: 'Use convertToString from utils',
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
const bannedProperties = bannedFunctions
    .slice(1)
    .map((f) => ({ property: f.name, message: f.message }));
module.exports = {
    bannedFunctions,
    bannedProperties,
};
