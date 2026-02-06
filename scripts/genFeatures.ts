import * as fs from 'fs/promises';
import * as path from 'path';
import commandLineArgs from 'command-line-args';
import { readAsJSON } from './utils/fs';
import { spawnAsPromised } from './utils/proc';

type FeatureTypeRaw = {
    code: string;
    desc: string;
    exp?: true;
    disabled?: true;
    path?: string;
};
type FeatureType = FeatureTypeRaw & {
    weight: number;
    providerDir: string;
};

const { disableFeatures, files } = commandLineArgs([
    { name: 'disableFeatures', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'files', alias: 'f', type: String, multiple: true },
]) as { disableFeatures: boolean; files: string[] };

if (!files || !files.length) {
    console.error(
        'No files for generating features code stated. Use -f option and list paths to .json files containing features information',
    );
    process.exit(1);
}

const featureName = (feature: FeatureType) => {
    const name = feature.code
        .toLocaleLowerCase()
        .split('_')
        .map((part, index) => {
            let result = part;
            if (index) {
                result = part[0].toUpperCase() + part.substring(1);
            }
            return result;
        })
        .join('');
    return `${name}`;
};

const filterFeaturesWithProviders = (f: FeatureType) => f.path;

const generateFeaturesCode = (features: FeatureType[]) => {
    const featureCodes: string[] = [];
    const featureDeclarations = features
        .map((feature) => {
            featureCodes.push(feature.code);
            return `/**
    *  ${feature.desc}
    */
    export const ${feature.code} = '${feature.code}'
    `;
        })
        .join('\n');
    const allFeatures = `export const features: Feature[] = [${featureCodes.join(
        ', ',
    )}];`;
    const featureType = `export type Feature = ${featureCodes
        .map((code) => `typeof ${code}`)
        .join(' | ')};`;

    const disabledFeatures = disableFeatures
        ? features.filter(({ disabled }) => disabled).map(({ code }) => code)
        : [];

    const disabledFeaturesCode = `export const disabledFeatures: Feature[] = [${disabledFeatures.join(
        ', ',
    )}];`;

    return `${featureDeclarations}\n${featureType}\n\n${allFeatures}\n\n${disabledFeaturesCode}\n`;
};

const generateInitCode = (features: FeatureType[]) => {
    const importBlocks: string[] = [];
    const featureBlocks: FeatureType[] = [];

    const featuresWithProviders = features.filter(filterFeaturesWithProviders);
    importBlocks.push(
        featuresWithProviders
            .map(
                (feature) =>
                    `import { initProvider as ${featureName(feature)}} from '${
                        feature.providerDir
                    }/${feature.path}'`,
            )
            .join('\n'),
    );
    featureBlocks.push(...featuresWithProviders);

    const exportBlock = `export const initImports = () => {
${featureBlocks
    .map((feature) => {
        return `${featureName(feature)}();`;
    })
    .join('\n')}
}`;

    return [...importBlocks, exportBlock].join('\n\n');
};

const GEN_DIR = './generated';
const run = async () => {
    fs.mkdir(GEN_DIR, { recursive: true });

    const allFeatures: FeatureType[] = files
        .flatMap((filePath) =>
            readAsJSON<FeatureTypeRaw[]>(filePath).map((feature) => {
                return {
                    weight: 0,
                    ...feature,
                    providerDir: path.join(filePath, '../src/providers'),
                } as FeatureType;
            }),
        )
        .sort((a, b) => a.weight - b.weight);

    await Promise.all([
        fs.writeFile(`${GEN_DIR}/init.ts`, generateInitCode(allFeatures)),
        fs.writeFile(
            `${GEN_DIR}/features.ts`,
            generateFeaturesCode(allFeatures),
        ),
    ]);
    await spawnAsPromised(
        'prettier',
        ['--write', `${GEN_DIR}/*.ts`, '--ignore-path', ''],
        { console: true },
    );
};

run();
