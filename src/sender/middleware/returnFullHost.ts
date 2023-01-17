import { config, host } from 'src/config';

/**
 * Convert host and resource to full URL
 */
export const returnFullHost = (resource: string, argHost?: string) =>
    `${config.cProtocol}//${argHost || host}/${resource}`;
