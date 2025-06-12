import path from 'path'
import { spawnSync } from 'node:child_process'
import type { DMMF } from '@prisma/generator-helper'

export const getPrismaClientDmmf = (datamodelPath: string): DMMF.Document => {
  let dmmf: DMMF.Document | undefined = undefined

  try {
    const relativePath = !datamodelPath
      ? /* Default Path */
        '/node_modules/.prisma/client/schema.prisma'
      : /* Custom Path */
        datamodelPath
    const datamodel = path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath)

    const generator = spawnSync(process.execPath, [path.join(__dirname, 'generate.js'), datamodel], {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 100, // 100MB
    })

    dmmf = JSON.parse(generator.stdout)
  } catch {}

  if (!dmmf) {
    try {
      const prismaClient = require('@prisma/client')
      dmmf = prismaClient.dmmf || prismaClient.Prisma.dmmf
    } catch (error) {
      throw new Error(
        `Failed to import prisma client package at @prisma/client. The following error occured while trying:`
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
