#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()

// ANSI color helpers
const useColor = !process.env.NO_COLOR && !process.argv.includes('--no-color')
const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  red: useColor ? '\x1b[31m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  blue: useColor ? '\x1b[34m' : '',
  magenta: useColor ? '\x1b[35m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : ''
}

/**
 * Parse pnpm-workspace.yaml for packages and catalogs
 */
function parsePnpmWorkspace(workspaceFilePath) {
  const result = {
    packageGlobs: ['apps/*', 'packages/*'],
    catalog: {}
  }

  if (!fs.existsSync(workspaceFilePath)) {
    return result
  }

  const content = fs.readFileSync(workspaceFilePath, 'utf8')
  const lines = content.split(/\r?\n/)
  let currentSection = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const sectionMatch = rawLine.match(/^([a-zA-Z0-9_-]+):/)
    if (sectionMatch && !rawLine.startsWith(' ') && !rawLine.startsWith('\t')) {
      currentSection = sectionMatch[1]
      if (currentSection === 'packages') {
        result.packageGlobs = []
      }
      continue
    }

    if (currentSection === 'packages') {
      const itemMatch = line.match(/^-\s*['"]?([^'"]+)['"]?/)
      if (itemMatch) {
        result.packageGlobs.push(itemMatch[1].trim())
      }
    } else if (currentSection === 'catalog') {
      const entryMatch = line.match(
        /^['"]?([^:'"]+)['"]?\s*:\s*['"]?([^'"]+)['"]?/
      )
      if (entryMatch) {
        result.catalog[entryMatch[1].trim()] = entryMatch[2].trim()
      }
    }
  }

  return result
}

/**
 * Parse .gitmodules to identify submodule paths
 */
function parseGitModules(rootDir) {
  const gitmodulesPath = path.join(rootDir, '.gitmodules')
  const submodules = new Map() // path -> url

  if (!fs.existsSync(gitmodulesPath)) {
    return submodules
  }

  const content = fs.readFileSync(gitmodulesPath, 'utf8')
  const lines = content.split(/\r?\n/)
  let currentPath = null
  let currentUrl = null

  for (const line of lines) {
    const trimmed = line.trim()
    const pathMatch = trimmed.match(/^path\s*=\s*(.+)$/)
    const urlMatch = trimmed.match(/^url\s*=\s*(.+)$/)

    if (pathMatch) {
      currentPath = pathMatch[1].trim().replace(/[\\/]/g, '/')
    }
    if (urlMatch) {
      currentUrl = urlMatch[1].trim()
    }

    if (currentPath) {
      submodules.set(currentPath, currentUrl || '')
    }
  }

  return submodules
}

/**
 * Find all package.json files matching the workspace globs
 */
function findWorkspacePackages(rootDir, packageGlobs) {
  const pkgPaths = [path.join(rootDir, 'package.json')]

  for (const pattern of packageGlobs) {
    const cleanPattern = pattern.replace(/[\\/]/g, '/')
    if (cleanPattern.endsWith('/*')) {
      const baseDir = path.join(rootDir, cleanPattern.slice(0, -2))
      if (fs.existsSync(baseDir) && fs.statSync(baseDir).isDirectory()) {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pkgJson = path.join(baseDir, entry.name, 'package.json')
            if (fs.existsSync(pkgJson)) {
              pkgPaths.push(pkgJson)
            }
          }
        }
      }
    } else {
      const directPath = path.join(rootDir, cleanPattern, 'package.json')
      if (fs.existsSync(directPath)) {
        pkgPaths.push(directPath)
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(pkgPaths))
}

/**
 * Main version check routine
 */
function checkVersions() {
  console.log(
    `\n${c.bold}${c.cyan}====================================================${c.reset}`
  )
  console.log(
    `${c.bold}${c.cyan}    🔍 PNPM WORKSPACE & SUBMODULE VERSION CHECK     ${c.reset}`
  )
  console.log(
    `${c.bold}${c.cyan}====================================================${c.reset}\n`
  )

  const workspaceFile = path.join(rootDir, 'pnpm-workspace.yaml')
  const { catalog, packageGlobs } = parsePnpmWorkspace(workspaceFile)
  const submodules = parseGitModules(rootDir)
  const pkgFiles = findWorkspacePackages(rootDir, packageGlobs)

  // Display Catalog
  const catalogKeys = Object.keys(catalog)
  console.log(
    `${c.bold}📦 Catalog configurado no pnpm-workspace.yaml:${c.reset}`
  )
  if (catalogKeys.length > 0) {
    for (const [dep, ver] of Object.entries(catalog)) {
      console.log(
        `   ${c.cyan}•${c.reset} ${c.bold}${dep}${c.reset}: ${c.green}${ver}${c.reset}`
      )
    }
  } else {
    console.log(`   ${c.gray}(Nenhum catalog definido)${c.reset}`)
  }
  console.log('')

  // Display Submodules
  console.log(`${c.bold}🔗 Git Submodules detectados:${c.reset}`)
  if (submodules.size > 0) {
    for (const [subPath, url] of submodules.entries()) {
      const urlInfo = url ? ` ${c.gray}(${url})${c.reset}` : ''
      console.log(
        `   ${c.magenta}•${c.reset} ${c.bold}${subPath}${c.reset}${urlInfo}`
      )
    }
  } else {
    console.log(
      `   ${c.gray}(Nenhum submodule registrado no .gitmodules)${c.reset}`
    )
  }
  console.log('')

  // Read and collect dependencies from each package.json
  const packageDataList = []
  const depUsageMap = new Map() // depName -> Array<{ pkgName, relPath, dirPath, isSubmodule, isRoot, section, rawVersion, resolvedVersion, isCatalog }>

  for (const pkgFile of pkgFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
      const relPath = path.relative(rootDir, pkgFile).replace(/[\\/]/g, '/')
      const dirPath = path.dirname(relPath)
      const isRoot = relPath === 'package.json'
      const isSubmodule = submodules.has(dirPath)

      const pkgInfo = {
        name: content.name || (isRoot ? 'finance-assets-web (root)' : dirPath),
        relPath,
        dirPath,
        isRoot,
        isSubmodule
      }
      packageDataList.push(pkgInfo)

      const sections = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies'
      ]
      for (const sec of sections) {
        if (!content[sec] || typeof content[sec] !== 'object') continue

        for (const [depName, rawVer] of Object.entries(content[sec])) {
          // Skip internal workspace packages
          if (
            typeof rawVer === 'string' &&
            (rawVer.startsWith('workspace:') || rawVer === 'workspace:*')
          ) {
            continue
          }

          let resolvedVer = rawVer
          let isCatalog = false

          if (rawVer === 'catalog:' || rawVer.startsWith('catalog:')) {
            isCatalog = true
            resolvedVer =
              catalog[depName] || `${rawVer} (⚠️ não encontrado no catalog)`
          }

          if (!depUsageMap.has(depName)) {
            depUsageMap.set(depName, [])
          }

          depUsageMap.get(depName).push({
            pkgName: pkgInfo.name,
            relPath,
            dirPath,
            isSubmodule,
            isRoot,
            section: sec,
            rawVersion: rawVer,
            resolvedVersion: resolvedVer,
            isCatalog
          })
        }
      }
    } catch (err) {
      console.error(`${c.red}Erro ao ler ${pkgFile}: ${err.message}${c.reset}`)
    }
  }

  console.log(
    `${c.bold}📁 Projetos e pacotes escaneados (${packageDataList.length}):${c.reset}`
  )
  for (const p of packageDataList) {
    const tag = p.isSubmodule
      ? `${c.magenta}[SUBMODULE]${c.reset}`
      : p.isRoot
        ? `${c.blue}[ROOT]${c.reset}`
        : `${c.cyan}[APP/PKG]${c.reset}`
    console.log(
      `   ${tag} ${c.bold}${p.name}${c.reset} ${c.gray}(${p.relPath})${c.reset}`
    )
  }
  console.log('')

  // Analyze mismatches
  const mismatches = []
  const catalogSuggestions = []

  for (const [depName, usages] of depUsageMap.entries()) {
    const distinctResolved = new Set(usages.map((u) => u.resolvedVersion))
    const catalogVer = catalog[depName]

    // Check if different resolved versions exist
    const hasVersionMismatch = distinctResolved.size > 1

    // Check if catalog is defined but some package uses a hardcoded version different from catalog
    const hasCatalogMismatch =
      catalogVer && usages.some((u) => u.resolvedVersion !== catalogVer)

    // Check if package could use catalog: instead of hardcoded identical version
    const hardcodedWhenCatalogAvailable =
      catalogVer &&
      usages.some((u) => !u.isCatalog && u.resolvedVersion === catalogVer)

    if (hasVersionMismatch || hasCatalogMismatch) {
      mismatches.push({
        depName,
        catalogVer,
        usages,
        distinctResolved: Array.from(distinctResolved),
        hasSubmoduleDifference: usages.some((u) => u.isSubmodule)
      })
    } else if (hardcodedWhenCatalogAvailable) {
      catalogSuggestions.push({
        depName,
        catalogVer,
        usages: usages.filter((u) => !u.isCatalog)
      })
    }
  }

  // Print Mismatches
  if (mismatches.length > 0) {
    console.log(
      `${c.bold}${c.red}⚠️  MISMATCHES ENCONTRADOS (${mismatches.length}):${c.reset}`
    )
    console.log(
      `${c.gray}────────────────────────────────────────────────────${c.reset}`
    )

    for (const m of mismatches) {
      console.log(
        `\n📦 Dependência: ${c.bold}${c.yellow}${m.depName}${c.reset}`
      )
      if (m.catalogVer) {
        console.log(
          `   📋 Versão no Catalog (${c.cyan}pnpm-workspace.yaml${c.reset}): ${c.green}${c.bold}${m.catalogVer}${c.reset}`
        )
      }

      if (m.hasSubmoduleDifference) {
        console.log(
          `   ${c.red}${c.bold}⚡ Atenção: Diferença detectada entre Submodule e o Projeto Principal!${c.reset}`
        )
      }

      console.log('   Ocorrências:')
      for (const u of m.usages) {
        const tag = u.isSubmodule
          ? `${c.magenta}[SUBMODULE]${c.reset}`
          : u.isRoot
            ? `${c.blue}[ROOT]${c.reset}`
            : `${c.cyan}[APP/PKG]${c.reset}`

        const isDifferentFromCatalog =
          m.catalogVer && u.resolvedVersion !== m.catalogVer
        const verColor =
          isDifferentFromCatalog || m.distinctResolved.length > 1
            ? c.red
            : c.green

        const catalogInfo = u.isCatalog
          ? `${c.gray}(via catalog:)${c.reset}`
          : `${c.yellow}(versão explícita: "${u.rawVersion}")${c.reset}`

        console.log(
          `     • ${tag} ${c.bold}${u.pkgName}${c.reset} ${c.gray}(${u.relPath} -> ${u.section})${c.reset}\n` +
            `       └─ Versão Resolvida: ${verColor}${c.bold}${u.resolvedVersion}${c.reset} ${catalogInfo}`
        )
      }
    }
    console.log(
      `\n${c.gray}────────────────────────────────────────────────────${c.reset}`
    )
  }

  // Print Catalog Opportunities/Suggestions
  if (catalogSuggestions.length > 0) {
    console.log(
      `\n${c.bold}${c.yellow}💡 SUGESTÕES DE ALINHAMENTO COM O CATALOG (${catalogSuggestions.length}):${c.reset}`
    )
    for (const s of catalogSuggestions) {
      console.log(
        `   • ${c.bold}${s.depName}${c.reset} já está no catalog (${c.green}${s.catalogVer}${c.reset}), mas é declarado explicitamente em:`
      )
      for (const u of s.usages) {
        console.log(
          `     - ${u.pkgName} ${c.gray}(${u.relPath})${c.reset} -> ${c.yellow}"${u.rawVersion}"${c.reset} (Pode ser alterado para ${c.cyan}"catalog:"${c.reset})`
        )
      }
    }
  }

  // Final Summary
  console.log(
    `\n${c.bold}${c.cyan}=================== RESUMO =========================${c.reset}`
  )
  console.log(
    `   Total de pacotes no workspace: ${c.bold}${packageDataList.length}${c.reset}`
  )
  console.log(
    `   Submodules verificados:        ${c.bold}${submodules.size}${c.reset}`
  )
  console.log(
    `   Dependências únicas checadas:  ${c.bold}${depUsageMap.size}${c.reset}`
  )
  console.log(
    `   Mismatches encontrados:        ${mismatches.length > 0 ? `${c.red}${c.bold}${mismatches.length}${c.reset}` : `${c.green}${c.bold}0 (Tudo alinhado!)${c.reset}`}`
  )
  console.log(
    `${c.bold}${c.cyan}====================================================${c.reset}\n`
  )

  if (mismatches.length > 0) {
    process.exit(1)
  } else {
    console.log(
      `${c.green}${c.bold}✔ Todas as versões entre projetos, submodules e catalog estão consistentes!${c.reset}\n`
    )
    process.exit(0)
  }
}

checkVersions()
