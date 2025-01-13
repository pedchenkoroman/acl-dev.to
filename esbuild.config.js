const { context } = require('esbuild');
const { readdir, readFile } = require('node:fs/promises');

(async () => {
  const lambdaFolders = './src/lambda';
  const cdkOutPath = './cdk.out';
  const lambdaFnType = 'AWS::Lambda::Function';
  const assetPath = 'aws:asset:path';

  const [templateFile] = await readdir(cdkOutPath).then((files) =>
    files.filter((fileName) => fileName.includes('template.json')),
  );

  const { Resources } = await readFile(`${cdkOutPath}/${templateFile}`, { encoding: 'utf8' }).then(
    JSON.parse,
  );

  const entryPoints = Object.keys(Resources)
    .filter((key) => {
      const { Type } = Resources[key];
      return Type === lambdaFnType;
    })
    .map((lambdaHash) => {
      const { Description } = Resources[lambdaHash].Properties;
      const asset = Resources[lambdaHash].Metadata[assetPath];

      return {
        out: `${asset}/index`,
        in: `${lambdaFolders}/${Description}`,
      };
    });
  console.log(entryPoints);
  const ctx = await context({
    entryPoints,
    outdir: './cdk.out',
    bundle: true,
    platform: 'node',
    sourcemap: 'both',
    loader: {
      '.graphql': 'text',
    },
    target: ['node20'],
  });

  await ctx.watch();
})();
