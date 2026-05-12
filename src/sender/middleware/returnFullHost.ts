import { cProtocol, host } from 'src/config';

/**
 * Convert host and resource to full URL
 */
export const returnFullHost = (resource: string, argHost?: string) =>
    `${cProtocol}//${argHost || host}/${resource}`;
