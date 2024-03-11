export const DEBUG_STORAGE_FLAG = 'debug' as const;
export const DEBUG_CTX_FLAG = `_ym_${DEBUG_STORAGE_FLAG}` as const;
export const DEBUG_URL_PARAM = DEBUG_CTX_FLAG;
