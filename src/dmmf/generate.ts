const SDK = require('@prisma/internals')
const path = require('path')

SDK.getDMMF({
  datamodelPath: path.join(process.cwd(), '/node_modules/.prisma/client/schema.prisma'),
}).then((dmmf) => console.log(JSON.stringify(dmmf)))
