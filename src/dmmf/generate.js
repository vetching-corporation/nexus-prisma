const { getSchemaWithPath, extractPreviewFeatures, getConfig, getDMMF } = require('@prisma/internals')

const [, , datamodelPath] = process.argv;

(async () => {
  try {
    const { schemas } = await getSchemaWithPath(undefined, undefined, { cwd: datamodelPath })
    const config = await getConfig({ datamodel: schemas, ignoreEnvVarErrors: true })
    const previewFeatures = extractPreviewFeatures(config.generators)
    const dmmf = await getDMMF({
      datamodel: schemas,
      previewFeatures
    })

    process.stdout.write(JSON.stringify(dmmf))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
