#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const openApiPath = path.join(rootDir, 'openapi.json')
const outputDir = path.join(rootDir, 'client-mobile', 'Generated')

function run(cmd, cwd = rootDir) {
	execSync(cmd, { cwd, stdio: 'inherit' })
}

console.log('Generating OpenAPI spec...')
run('npm run generate:openapi')

if (!fs.existsSync(openApiPath)) {
	console.error('OpenAPI spec not found at', openApiPath)
	process.exit(1)
}

console.log('Generating Swift code from OpenAPI spec...')
fs.mkdirSync(outputDir, { recursive: true })

try {
	run('npx @openapitools/openapi-generator-cli generate --generator-key swift')
	console.log('Swift code generated at', outputDir)
} catch (err) {
	console.error('OpenAPI Generator failed.')
	console.error('Java or Docker is required. With Docker: ensure openapitools.json has useDocker: true')
	process.exit(1)
}
