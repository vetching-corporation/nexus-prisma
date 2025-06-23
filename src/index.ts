import * as semver from 'semver'
import { colors } from './colors'

const pkgJson = require('../package.json')

function ensureDepIsInstalled(depName: string) {
  try {
    require(depName)
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      if (err.message.includes('.prisma/client')) {
        console.error(
          `${colors.red('ERROR:')} ${colors.green(
            depName
          )} must be installed as a dependency. Please run \`${colors.green('just prisma build')}\`.`
        )
      } else {
        console.error(
          `${colors.red('ERROR:')} ${colors.green(
            depName
          )} must be installed as a dependency. Please run \`${colors.green(`npm install ${depName}`)}\`.`
        )
      }
      process.exit(1)
    } else {
      throw err
    }
  }
}

function ensurePeerDepRangeSatisfied(depName: string) {
  try {
    const installedVersion: string | undefined = require(`${depName}/package.json`).version?.split('-')[0]

    // npm enforces that package manifests have a valid "version" field so this case _should_ never happen under normal circumstances.
    if (!installedVersion) {
      console.warn(
        colors.yellow(
          `Warning: No version found for "${depName}". We cannot check if the consumer has satisfied the specified range.`
        )
      )
      return
    }

    const supportedRange: string | undefined = pkgJson.peerDependencies[depName]?.split('-')[0]

    if (!supportedRange) {
      console.warn(
        colors.yellow(
          `Warning: @vetching-corporation/nexus-prisma has no such peer dependency for "${depName}". We cannot check if the consumer has satisfied the specified range.`
        )
      )
      return
    }

    if (semver.satisfies(installedVersion, supportedRange)) {
      return
    }

    console.warn(
      colors.yellow(
        `Warning: @vetching-corporation/nexus-prisma@${pkgJson.version} does not support ${depName}@${installedVersion}. The supported range is: \`${supportedRange}\`. This could lead to undefined behaviors and bugs.`
      )
    )
  } catch {}
}

if (process.env.STAGE_RUNTIME !== 'docker' && process.env.STAGE_RUNTIME !== 'standalone') {
  ensureDepIsInstalled('nexus')
  ensureDepIsInstalled('graphql')

  ensurePeerDepRangeSatisfied('graphql')
  ensurePeerDepRangeSatisfied('nexus')
  ensurePeerDepRangeSatisfied('@prisma/client')
}

export * from './plugin'
