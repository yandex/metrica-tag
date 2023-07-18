import {
    CounterOptions,
    RawTrackLinkParams,
} from 'src/utils/counterOptions/types';
import { getGlobalStorage } from 'src/storage/global';
import { counterLocalStorage } from 'src/storage/localStorage';
import { getHid } from 'src/middleware/watchSyncFlags/brinfoFlags/hid';
import { GetSenderType } from 'src/sender/types';
import { UNSUBSCRIBE_PROPERTY } from 'src/providers';
import {
    LINK_CLICK_HIT_PROVIDER,
    METHOD_NAME_ADD_FILE_EXTENSION,
    METHOD_NAME_EXTERNAL_LINK_CLICK,
    METHOD_NAME_FILE_CLICK,
    METHOD_NAME_TRACK_LINKS,
} from './const';

export type SenderType = GetSenderType<typeof LINK_CLICK_HIT_PROVIDER>;

/**
 * Additional options passed to `file` and `extLink` counter methods
 */
export type UserOptions = {
    /** Callback context */
    ctx?: any;
    /** The function that will be called after sending the hit */
    callback?: () => void;
    /** Visit parameters to be sent with a hit */
    params?: Record<string, any>;
    /** Link title */
    title?: string;
};

export type AddFileExtensionHandler<T = any> = (ext: string | string[]) => T;

export type ExternalLinkClickHandler<T = any> = (
    url: string,
    options: UserOptions,
) => T;

export type FileClickHandler<T = any> = (
    url: string,
    options?: UserOptions,
) => T;

/**
 * Settings for tracked click
 */
export type SendOptions = {
    /** URL of link */
    url: string;
    /** Flag for external links, can be set simultaneously with isDownload */
    isExternalLink?: boolean;
    /** Flag for download links, can be set simultaneously with isExternalLink */
    isDownload?: boolean;
    /** Sender function */
    sender: SenderType;
    /** Deprecated */
    noIndex?: boolean;
    /** Options defined by user */
    userOptions?: UserOptions;
    /** The flag contains the value of the `isTrusted` event type property from the native event type.
     *
     * [MDN Docs](https://developer.mozilla.org/ru/docs/Web/API/Event/isTrusted)
     */
    isTrustedEvent?: boolean;
} & Pick<UserOptions, 'title'>;

/**
 * Parameters for tracking clicks
 */
export type ClickHandlerOptions = {
    /** Current window */
    ctx: Window;
    /** Counter options on initialization */
    counterOptions: CounterOptions;
    /** Hit unique identifier */
    hitId: ReturnType<typeof getHid>;
    /** Enriches the data, decides where to send it, and transfers it to the transport */
    sender: SenderType;
    /** Tab-level storage in the context of a window */
    globalStorage: ReturnType<typeof getGlobalStorage>;
    /** localStorage with the counter prefix */
    counterLocalStorage: ReturnType<typeof counterLocalStorage>;
    /** List of monitored file extensions */
    fileExtensions: string[];
    /** A function to check whether link tracking is enabled */
    trackLinksEnabled: () => boolean;
};

/**
 * Handler for enabling/disabling trackLinks
 */
export type TrackLinks = (params: RawTrackLinkParams) => void;

/**
 * The object returned from the provider, the properties correspond to the methods of the counter instance
 */
export type ClickProviderParams = {
    /** Track file downloads */
    [METHOD_NAME_FILE_CLICK]: FileClickHandler;
    /** Track external links */
    [METHOD_NAME_EXTERNAL_LINK_CLICK]: ExternalLinkClickHandler;
    /** Track file extensions */
    [METHOD_NAME_ADD_FILE_EXTENSION]: AddFileExtensionHandler;
    /** Destructor property */
    [UNSUBSCRIBE_PROPERTY]: () => void;
    /** Track links */
    [METHOD_NAME_TRACK_LINKS]: TrackLinks;
};

declare module 'src/utils/counter/type' {
    interface CounterObject {
        /** Track file extensions */
        [METHOD_NAME_ADD_FILE_EXTENSION]?: AddFileExtensionHandler<CounterObject>;
        /** Track external links */
        [METHOD_NAME_EXTERNAL_LINK_CLICK]?: ExternalLinkClickHandler<CounterObject>;
        /** Track file downloads */
        [METHOD_NAME_FILE_CLICK]?: FileClickHandler<CounterObject>;
        /** Track links */
        [METHOD_NAME_TRACK_LINKS]?: TrackLinks;
    }
}
