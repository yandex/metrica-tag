export const CLICKMAP_RESOURCE = 'clmap';

export const DELTA_SAME_CLICKS = 2;
export const TIMEOUT_CLICK = 50;
export const TIMEOUT_SAME_CLICKS = 1000;
export const CLICKMAP_PROVIDER = 'm';

export const GLOBAL_STORAGE_CLICKS_KEY = 'cls';
export const TAGS = [
    'A', // Распространенные теги
    'B',
    'BIG',
    'BODY',
    'BUTTON',
    'DD',
    'DIV',
    'DL',
    'DT',
    'EM',
    'FIELDSET',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HR',
    'I',
    'IMG',
    'INPUT',
    'LI',
    'OL',
    'P',
    'PRE',
    'SELECT',
    'SMALL',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'TABLE',
    'TBODY',
    'TD',
    'TEXTAREA',
    'TFOOT',
    'TH',
    'THEAD',
    'TR',
    'U',
    'UL',
    // Менее распространенные теги
    'ABBR',
    'AREA',
    'BLOCKQUOTE',
    'CAPTION',
    'CENTER',
    'CITE',
    'CODE',
    'CANVAS',
    'DFN',
    'EMBED',
    'FONT',
    'INS',
    'KBD',
    'LEGEND',
    'LABEL',
    'MAP',
    'OBJECT',
    'Q',
    'S',
    'SAMP',
    'STRIKE',
    'TT',
    // html 2
    'ARTICLE',
    'AUDIO',
    'ASIDE',
    'FOOTER',
    'HEADER',
    'MENU',
    'METER',
    'NAV',
    'PROGRESS',
    'SECTION',
    'TIME',
    'VIDEO',
    'NOINDEX',
    'NOBR',
    'MAIN',
    // SVG
    'svg',
    'circle',
    'clippath',
    'ellipse',
    'defs',
    'foreignobject',
    'g',
    'glyph',
    'glyphref',
    'image',
    'line',
    'lineargradient',
    'marker',
    'mask',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialgradient',
    'rect',
    'set',
    'text',
    'textpath',
    'title',
];

/**
 * Heat map of clicks parameters
 */
export type TClickMapParams =
    | boolean
    | {
          /** A function that allows you to decide which clicks to send */
          filter?: Function;
          /** Ignore list of HTML tags */
          ignoreTags?: string[];
          /** Clicks count limitation */
          quota?: number;
          /** Enable URL hash parameter change tracking */
          isTrackHash?: boolean;
      };
