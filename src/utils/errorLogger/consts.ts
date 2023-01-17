export const TOO_LONG_FUNCTION_EXECUTION = 300;
export const TOO_LONG_ERROR_NAME = `t.l.${TOO_LONG_FUNCTION_EXECUTION}`;
export const DELIMITER = '.';
export const KNOWN_ERROR = 'err.kn';
export const UNCATCHABLE_ERROR_PROPERTY = 'unk';
export const IGNORED_ERRORS = [
    // игнорим CSP ошибки
    'http.0.st..rt.',
    'network error occurred',
    'send beacon',
    'Content Security Policy',
    'DOM Exception 18',
];
