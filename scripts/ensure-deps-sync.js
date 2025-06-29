const semver = require('semver')
const packageJson = require('../package.json')

const prismaDeps = [
  ...Object.entries(packageJson.dependencies),
  ...Object.entries(packageJson.devDependencies),
].filter(([depName]) => depName.startsWith('@prisma/'))

const validVersionRange = packageJson.peerDependencies['@vetching-corporation/prisma-client'].split('-')[0]

const invalidDeps = prismaDeps.filter(
  ([, prismaDepVersion]) => {
    const targetVersion = prismaDepVersion.split('-')[0]
    return !semver.satisfies(targetVersion, validVersionRange)
  }
)

if (invalidDeps.length > 0) {
  console.log(
    `Some of your Prisma dependencies are not in sync with the supported version range ${validVersionRange}\n\n`,
    invalidDeps.map(([name, ver]) => `${name}@${ver}`).join(', ')
  )
  process.exit(1)
}
