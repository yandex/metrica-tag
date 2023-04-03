import {
    ConstructorOptions,
    JSDOM,
    BinaryData,
    BaseOptions,
    FileOptions,
    VirtualConsole,
    CookieJar,
    ReconfigureSettings,
} from 'jsdom';
import { Context } from 'vm';

/**
 * This class wraps up JSDOM from 'jsdom' library.
 * The wrapper is needed for compatibility reasons,
 * since typeof JSDOM.window is incompatible with local Window declaration.
 */
export class JSDOMWrapper {
    private instance: JSDOM;

    constructor(
        html?: string | Buffer | BinaryData,
        options?: ConstructorOptions,
    ) {
        this.instance = new JSDOM(html, options);
        this.window = this.instance.window as unknown as Window;
        this.virtualConsole = this.instance
            .virtualConsole as unknown as VirtualConsole;
        this.cookieJar = this.instance.cookieJar as unknown as CookieJar;
    }

    static async fromURL(
        url: string,
        options?: BaseOptions,
    ): Promise<JSDOMWrapper> {
        return JSDOM.fromURL(url, options) as unknown as Promise<JSDOMWrapper>;
    }

    static fromFile(url: string, options?: FileOptions): Promise<JSDOMWrapper> {
        return JSDOM.fromFile(url, options) as unknown as Promise<JSDOMWrapper>;
    }

    static fragment(html: string): DocumentFragment {
        return JSDOM.fragment(html) as unknown as DocumentFragment;
    }

    readonly window: Window;

    readonly virtualConsole: VirtualConsole;

    readonly cookieJar: CookieJar;

    /**
     * The serialize() method will return the HTML serialization of the document, including the doctype.
     */
    serialize(): string {
        return this.instance.serialize();
    }

    /**
     * The nodeLocation() method will find where a DOM node is within the source document,
     * returning the parse5 location info for the node.
     *
     * @throws {Error} If the JSDOM was not created with `includeNodeLocations`
     */
    nodeLocation(node: Node): any | null {
        return this.instance.nodeLocation(node);
    }

    /**
     * The built-in `vm` module of Node.js is what underpins JSDOM's script-running magic.
     * Some advanced use cases, like pre-compiling a script and then running it multiple
     * times, benefit from using the `vm` module directly with a jsdom-created `Window`.
     *
     * @throws {TypeError}
     * Note that this method will throw an exception if the `JSDOM` instance was created
     * without `runScripts` set, or if you are using JSDOM in a web browser.
     */
    getInternalVMContext(): Context {
        return this.instance.getInternalVMContext();
    }

    /**
     * The reconfigure method allows changing the `window.top` and url from the outside.
     */
    reconfigure(settings: ReconfigureSettings): void {
        return this.instance.reconfigure(settings);
    }
}
