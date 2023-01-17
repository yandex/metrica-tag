import { METHOD_NAME_HIT } from 'src/providers/artificialHit/const';
import { METHOD_NAME_PARAMS } from 'src/providers/params/const';
import { METHOD_NAME_GOAL } from 'src/providers/goal/const';
import { METHOD_NAME_USER_PARAMS } from 'src/providers/userParams/const';
import { METHOD_TRACK_HASH } from 'src/providers/trackHash/const';
import {
    METHOD_NAME_ACCURATE_TRACK_BOUNCE,
    METHOD_NAME_NOT_BOUNCE,
} from 'src/providers/notBounce/const';
import {
    METHOD_NAME_ADD_FILE_EXTENSION,
    METHOD_NAME_EXTERNAL_LINK_CLICK,
    METHOD_NAME_FILE_CLICK,
    METHOD_NAME_TRACK_LINKS,
} from 'src/providers/clicks/const';
import { METHOD_DESTRUCT } from 'src/providers/destruct/const';
import { METHOD_NAME_SET_USER_ID } from 'src/providers/setUserID/const';
import { METHOD_NAME_GET_CLIENT_ID } from 'src/providers/getClientID/const';
import { METHOD_NAME_CLICK_MAP } from 'src/providers/clickmapMethod/const';
import { METHOD_NAME_ENABLE_ALL } from 'src/providers/enableAll/const';

export const METHODS_TELEMETRY_KEYS_MAP: Record<string, string> = {
    [METHOD_NAME_HIT]: 'h',
    [METHOD_NAME_PARAMS]: 'p',
    [METHOD_NAME_GOAL]: 'g',
    [METHOD_NAME_USER_PARAMS]: 'up',
    [METHOD_TRACK_HASH]: 'th',
    [METHOD_NAME_ACCURATE_TRACK_BOUNCE]: 'atb',
    [METHOD_NAME_NOT_BOUNCE]: 'nb',
    [METHOD_NAME_ADD_FILE_EXTENSION]: 'fe',
    [METHOD_NAME_EXTERNAL_LINK_CLICK]: 'el',
    [METHOD_NAME_FILE_CLICK]: 'fc',
    [METHOD_NAME_TRACK_LINKS]: 'tl',
    [METHOD_DESTRUCT]: 'd',
    [METHOD_NAME_SET_USER_ID]: 'ui',
    [METHOD_NAME_GET_CLIENT_ID]: 'ci',
    [METHOD_NAME_CLICK_MAP]: 'cm',
    [METHOD_NAME_ENABLE_ALL]: 'ea',
};

export const METHODS_TELEMETRY_GLOBAL_STORAGE_KEY = 'mt';
