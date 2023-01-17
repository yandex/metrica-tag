import { memo } from 'src/utils/function/memo';
import { globalStorage } from './global';

export const getGlobalStorage = memo(globalStorage);
