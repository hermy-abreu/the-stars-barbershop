import { readFile, writeFile, readdir, copyFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = 'dist'
const base = '/the-stars-barbershop/'
const replacements = [
  ['/images/', base + 'images/'],
  ['/icons/', base + 'icons/'],
  ['/manifest.webmanifest', base + 'manifest.webmanifest'],
  ['/sw.js', base + 'sw.js'],
]
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, item.name)
    if (item.isDirectory()) { await walk(file); continue }
    if (!/\.(html|js|css)$/.test(item.name)) continue
    let source = await readFile(file, 'utf8')
    for (const [from,to] of replacements) {
      // Do not duplicate an existing prefix.
      source = source.replaceAll(from, to)
      source = source.replaceAll(base + base.slice(1), base)
    }
    await writeFile(file, source)
  }
}
await walk(root)
// GitHub Pages uses this fallback when /the-stars-barbershop/staff is visited directly.
await copyFile(join(root, 'index.html'), join(root, '404.html'))
console.log('GitHub Pages asset paths and SPA fallback prepared.')
