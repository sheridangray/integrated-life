import * as fs from 'fs'
import * as path from 'path'
import { generateOpenAPIDocument } from '../src/lib/openapi'

const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
const spec = generateOpenAPIDocument(apiUrl)

const outputPath = path.resolve(__dirname, '../../openapi.json')
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2))
console.log(`OpenAPI spec written to ${outputPath}`)
