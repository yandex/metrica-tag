export const variableRegex = /{(\w+)}/g;

export const PAGE_VIEW_CONSOLE_MESSAGE = 'pv';
export const PAGE_VIEW_PARAMS_CONSOLE_MESSAGE = 'pv.p';
export const LINK_CLICK_CONSOLE_MESSAGE = 'lcl';
export const LINK_CLICK_CONSOLE_PARAMS_MESSAGE = 'lcl.p';
export const BUTTON_GOAL_CONSOLE_MESSAGE = 'gbn';
export const BUTTON_GOAL_INIT_CONSOLE_MESSAGE = 'gbi';
export const BUTTON_GOAL_INIT_CONSOLE_PARAMS_MESSAGE = 'gbi.p';
export const FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE = 'fpno';
export const FIRST_PARTY_EMPTY_CONSOLE_MESSAGE = 'fpeo';
export const GOAL_REACH_CONSOLE_MESSAGE = 'gr';
export const GOAL_REACH_CONSOLE_PARAMS_MESSAGE = 'gr.p';
export const HIT_CONSOLE_MESSAGE = 'h';
export const HIT_CONSOLE_PARAMS_MESSAGE = 'h.p';
export const PARAMS_CONSOLE_MESSAGE = 'pa';
export const PARAMS_PARAMS_CONSOLE_MESSAGE = 'pa.p';
export const SET_UID_CONSOLE_MESSAGE = 'pau';
export const SET_UID_PARAMS_CONSOLE_MESSAGE = 'pau.p';
export const USER_PARAMS_CONSOLE_MESSAGE = 'paup';
export const USER_PARAMS_PARAMS_CONSOLE_MESSAGE = 'paup.p';
export const DUPLICATE_COUNTERS_CONSOLE_MESSAGE = 'dc';
export const METHOD_NOT_SUPPORTED_CONSOLE_MESSAGE = 'ns';
export const FORM_GOALS_INIT_CONSOLE_MESSAGE = 'fgi';
export const FORM_GOALS_PARAMS_INIT_CONSOLE_MESSAGE = 'fgi.p';
export const EMPTY_LINK_CONSOLE_MESSAGE = 'clel';
export const NOT_BOUNCE_NO_CALLBACK_CONSOLE_MESSAGE = 'nbnc';
export const NON_NATIVE_FUNCTION_WARNING_CONSOLE_MESSAGE = 'nnw';
export const NO_COUNTER_INSTANCE_CONSOLE_MESSAGE = 'nci';
export const WRONG_USER_PARAMS_CONSOLE_MESSAGE = 'wup';
export const WRONG_USER_ID_CONSOLE_MESSAGE = 'wuid';
export const FORM_GOAL_CONSOLE_MESSAGE = 'fg';
export const FORM_GOAL_PARAMS_CONSOLE_MESSAGE = 'fg.p';

export const CONSOLE_DICTIONARY: Record<string, string> = {
    [BUTTON_GOAL_CONSOLE_MESSAGE]:
        'Button goal. Counter {id}. Button: {query}.',
    [BUTTON_GOAL_INIT_CONSOLE_MESSAGE]: 'Button goal. Counter {id}. Init.',
    [BUTTON_GOAL_INIT_CONSOLE_PARAMS_MESSAGE]:
        'Button goal. Counter {id}. Init. Params: ',
    [DUPLICATE_COUNTERS_CONSOLE_MESSAGE]:
        'Duplicate counter {key} initialization',
    [EMPTY_LINK_CONSOLE_MESSAGE]: 'Empty link',
    [FIRST_PARTY_EMPTY_CONSOLE_MESSAGE]:
        'First party params error. Empty object.',
    [FIRST_PARTY_NOT_AN_OBJECT_CONSOLE_MESSAGE]:
        'First party params error. Not an object.',
    [FORM_GOALS_INIT_CONSOLE_MESSAGE]: 'Form goal. Counter {id}. Init.',
    [FORM_GOALS_PARAMS_INIT_CONSOLE_MESSAGE]:
        'Form goal. Counter {id}. Init. Params: ',
    [FORM_GOAL_CONSOLE_MESSAGE]: 'Form goal. Counter {id}. Form: {query}.',
    [FORM_GOAL_PARAMS_CONSOLE_MESSAGE]:
        'Form goal. Counter {id}. Form: {query}. Params: ',
    [GOAL_REACH_CONSOLE_MESSAGE]: 'Reach goal. Counter: {id}. Goal id: {goal}',
    [GOAL_REACH_CONSOLE_PARAMS_MESSAGE]:
        'Reach goal. Counter: {id}. Goal id: {goal}. Params: ',
    [HIT_CONSOLE_MESSAGE]:
        'PageView. Counter {id}. URL: {url}. Referrer: {ref}',
    [HIT_CONSOLE_PARAMS_MESSAGE]:
        'PageView. Counter {id}. URL: {url}. Referrer: {ref}. Params: ',
    [LINK_CLICK_CONSOLE_MESSAGE]: '{prefix}. Counter {id}. Url: {url}',
    [LINK_CLICK_CONSOLE_PARAMS_MESSAGE]:
        '{prefix}. Counter {id}. Url: {url}. Params: ',
    [METHOD_NOT_SUPPORTED_CONSOLE_MESSAGE]: 'Not supported',
    [NON_NATIVE_FUNCTION_WARNING_CONSOLE_MESSAGE]:
        'Function "{name}" has been overridden, this may cause issues with Metrika counter',
    [NOT_BOUNCE_NO_CALLBACK_CONSOLE_MESSAGE]: '"callback" argument missing',
    [NO_COUNTER_INSTANCE_CONSOLE_MESSAGE]: 'No counter instance found',
    [PAGE_VIEW_CONSOLE_MESSAGE]:
        'PageView. Counter {id}. URL: {url}. Referrer: {ref}',
    [PAGE_VIEW_PARAMS_CONSOLE_MESSAGE]:
        'PageView. Counter {id}. URL: {url}. Referrer: {ref}. Params: ',
    [PARAMS_CONSOLE_MESSAGE]: 'Params. Counter {id}',
    [PARAMS_PARAMS_CONSOLE_MESSAGE]: 'Params. Counter {id}. Params: ',
    [SET_UID_CONSOLE_MESSAGE]: 'Set user id {uid}',
    [SET_UID_PARAMS_CONSOLE_MESSAGE]: 'Set user id {uid}. Params: ',
    [USER_PARAMS_CONSOLE_MESSAGE]: 'User params. Counter {id}',
    [USER_PARAMS_PARAMS_CONSOLE_MESSAGE]: 'User params. Counter {id}. Params: ',
    [WRONG_USER_ID_CONSOLE_MESSAGE]: 'Incorrect user ID',
    [WRONG_USER_PARAMS_CONSOLE_MESSAGE]: 'Wrong user params',
};
