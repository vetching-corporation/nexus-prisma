import path from 'path'
import type { DMMF } from '@prisma/generator-helper'
import { getDMMFSync } from '@vetching-corporation/prisma-internals'

export const getPrismaClientDmmf = (packagePath: string) => {
  let dmmf: DMMF.Document | undefined = undefined

  try {
    const relativePath = !packagePath
      ? /* Default Path */
        '/node_modules/.prisma/client/schema.prisma'
      : /* Custom Path */
        `${packagePath}/schema.prisma`
    const datamodelPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(process.cwd(), relativePath)

    dmmf = getDMMFSync({ datamodelPath })
  } catch {}

  if (!dmmf) {
    try {
      const prismaClient = require(packagePath)
      dmmf = prismaClient.dmmf || prismaClient.Prisma.dmmf
    } catch (error) {
      throw new Error(
        `Failed to import prisma client package at ${packagePath}. The following error occured while trying:`
      )
    }
  }

  if (!dmmf) {
    throw new Error(`\
You most likely forgot to initialize the Prisma Client. Please run \`prisma generate\` and try to run it again.
If that does not solve your problem, please open an issue.`)
  }

  return dmmf
}
