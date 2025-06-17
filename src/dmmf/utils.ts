import path from 'path'
import type * as DMMF from '@prisma/dmmf'
import { getDMMFSync } from './getDMMFSync'

export const getPrismaClientDmmf = (datamodelPath: string): DMMF.Document => {
  let dmmf: DMMF.Document | undefined = undefined

  try {
    const relativePath = !datamodelPath
      ? /* Default Path */
        '/node_modules/.prisma/client/schema.prisma'
      : /* Custom Path */
        datamodelPath
    const datamodel = path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath)

    dmmf = getDMMFSync({ datamodel })
  } catch {}

  if (!dmmf) {
    throw new Error(`\
You most likely forgot to initialize the Prisma Client. Please run \`prisma generate\` and try to run it again.
If that does not solve your problem, please open an issue.`)
  }

  return dmmf
}
