import type * as DMMF from '@prisma/dmmf'
import { ErrorArea, getWasmError, isWasmPanic, RustPanic, GetDMMFOptions } from '@prisma/internals'
import { match } from 'ts-pattern'
import prismaSchemaWasm from '@prisma/prisma-schema-wasm'

type WasmPanic = Error & { name: 'RuntimeError' }

export function getDMMFSync(options: GetDMMFOptions): DMMF.Document {
  try {
    if (process.env.FORCE_PANIC_QUERY_ENGINE_GET_DMMF) {
      prismaSchemaWasm.debug_panic()
    }

    const params = JSON.stringify({
      prismaSchema: options.datamodel,
      noColor: Boolean(process.env.NO_COLOR),
    })
    const resultJson = prismaSchemaWasm.get_dmmf(params)

    return JSON.parse(resultJson) as DMMF.Document
  } catch (e: any) {
    const error = match(e)
      .when(
        (v): v is WasmPanic => isWasmPanic(v),
        (wp) => {
          const { message, stack } = getWasmError(wp)
          return new RustPanic(message, stack, '@prisma/prisma-schema-wasm get_dmmf', ErrorArea.FMT_CLI)
        }
      )
      .otherwise((err) => {
        return err
      })

    throw error
  }
}
