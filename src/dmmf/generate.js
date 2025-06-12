const { getDMMF } = require('@prisma/internals')

const [, , datamodel] = process.argv

  (async () => {
    try {
      const dmmf = await getDMMF({ datamodel })
      process.stdout.write(JSON.stringify(dmmf))
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })()
