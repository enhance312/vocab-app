/**
 * Post-build script: inlines all JS and CSS into a single HTML file.
 * The output can be opened directly from file:// on any browser, no server needed.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = join(distDir, 'index.html')

let html = readFileSync(htmlPath, 'utf-8')

// Remove SW registration reference if any
html = html.replace(/<script[^>]*registerSW[^>]*><\/script>/g, '')

// Collect all external resources before modifying html
// (modifying html inside a regex loop breaks lastIndex)

// Find CSS links
const cssLinks = []
const cssRe = /<link rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/g
let m
while ((m = cssRe.exec(html)) !== null) {
  cssLinks.push({ tag: m[0], href: m[1] })
}

// Find JS module scripts
const jsScripts = []
const jsRe = /<script type="module" crossorigin src="([^"]*)"><\/script>/g
while ((m = jsRe.exec(html)) !== null) {
  jsScripts.push({ tag: m[0], src: m[1] })
}

// Apply CSS inlining
for (const { tag, href } of cssLinks) {
  const path = join(distDir, href)
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8')
    html = html.replace(tag, `<style>${content}</style>`)
  }
}

// Apply JS inlining — strip type="module" since IIFE format is plain JS
for (const { tag, src } of jsScripts) {
  const path = join(distDir, src)
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8')
    html = html.replace(tag, `<script>${content}</script>`)
  }
}

// Remove preload/modulepreload links (now inlined)
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '')

const outPath = join(distDir, 'vocab.html')
// Prepend UTF-8 BOM — Chinese browsers need it to detect encoding correctly
writeFileSync(outPath, '﻿' + html, 'utf-8')

const sizeKB = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(0)
console.log(`Done: ${outPath} (${sizeKB} KB)`)
