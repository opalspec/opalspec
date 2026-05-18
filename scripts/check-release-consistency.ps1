[CmdletBinding()]
param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string[]]$StaleVersion = @(),
  [string[]]$StalePhrase = @('Key Design Decisions')
)

$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath($Root)
$payloadRoot = Join-Path $repoRoot 'payload'
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([Parameter(Mandatory = $true)][string]$Message)
  $script:failures.Add($Message) | Out-Null
}

function Get-RepoText {
  param([Parameter(Mandatory = $true)][string]$RelativePath)
  $path = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $path)) {
    Add-Failure "Missing file: $RelativePath"
    return ''
  }
  return Get-Content -LiteralPath $path -Raw -Encoding UTF8
}

function Assert-Contains {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][string[]]$Needles,
    [Parameter(Mandatory = $true)][string]$Label
  )

  $text = Get-RepoText -RelativePath $RelativePath
  foreach ($needle in $Needles) {
    if ($text -notlike "*$needle*") {
      Add-Failure "$Label missing '$needle' in $RelativePath"
    }
  }
}

function Assert-VersionInText {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][string]$Version
  )

  $text = Get-RepoText -RelativePath $RelativePath
  if ($text -notmatch ('version:\s*"' + [Regex]::Escape($Version) + '"')) {
    Add-Failure "Version mismatch in $RelativePath; expected metadata version $Version"
  }
}

function Assert-JsonVersion {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][string]$Version
  )

  $text = Get-RepoText -RelativePath $RelativePath
  if ([string]::IsNullOrWhiteSpace($text)) { return }
  try {
    $json = $text | ConvertFrom-Json
    if ($json.version -ne $Version) {
      Add-Failure "Version mismatch in $RelativePath; expected $Version, found $($json.version)"
    }
  } catch {
    Add-Failure "Invalid JSON in ${RelativePath}: $($_.Exception.Message)"
  }
}

function Search-PayloadForForbiddenText {
  param([Parameter(Mandatory = $true)][string[]]$Patterns)

  if (-not (Test-Path -LiteralPath $payloadRoot)) {
    Add-Failure "Missing payload directory: $payloadRoot"
    return
  }

  $files = Get-ChildItem -LiteralPath $payloadRoot -Recurse -Force -File
  foreach ($file in $files) {
    $relative = $file.FullName
    if ($relative.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      $relative = $relative.Substring($repoRoot.Length).TrimStart('\', '/')
    }
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    foreach ($pattern in $Patterns) {
      if (-not [string]::IsNullOrWhiteSpace($pattern) -and $text -like "*$pattern*") {
        Add-Failure "Forbidden text '$pattern' found in $relative"
      }
    }
  }
}

if (-not (Test-Path -LiteralPath $payloadRoot)) {
  Add-Failure "Missing payload directory: $payloadRoot"
}

$version = (Get-RepoText -RelativePath 'payload/.opal/VERSION').Trim()
if ([string]::IsNullOrWhiteSpace($version)) {
  Add-Failure 'payload/.opal/VERSION is empty'
}

Assert-VersionInText -RelativePath 'payload/.codex/skills/opalspec/SKILL.md' -Version $version
Assert-VersionInText -RelativePath 'payload/.claude/skills/opalspec/SKILL.md' -Version $version
Assert-VersionInText -RelativePath 'payload/plugins/opalspec/skills/opalspec/SKILL.md' -Version $version
Assert-JsonVersion -RelativePath 'payload/plugins/opalspec/.codex-plugin/plugin.json' -Version $version

Assert-Contains -RelativePath 'payload/.opal/runtime/command-manifest.md' -Needles @(
  '/opal:preflight',
  'opal-preflight',
  'opal/preflight',
  'opal-preflight.prompt.md',
  'preflight-instructions.md'
) -Label 'Command manifest'

Assert-Contains -RelativePath 'install.ps1' -Needles @(
  'opal-preflight.md'
) -Label 'Installer Codex prompt copy list'

Assert-Contains -RelativePath 'payload/.opal/runtime/scripts/install-codex-prompts.ps1' -Needles @(
  'opal-preflight.md'
) -Label 'Installed Codex prompt script'

Search-PayloadForForbiddenText -Patterns @(
  'sunflower2',
  'Sunflower2',
  'example.com',
  'local@example.com'
)

if ($StalePhrase.Count -gt 0) {
  Search-PayloadForForbiddenText -Patterns $StalePhrase
}

if ($StaleVersion.Count -gt 0) {
  Search-PayloadForForbiddenText -Patterns $StaleVersion
}

$designWrappers = @(
  'payload/.opal/runtime/prompts/design.prompt.md',
  'payload/.opal/runtime/codex-prompts/opal-design.md',
  'payload/.claude/commands/opal/design.md',
  'payload/.cursor/commands/opal-design.md',
  'payload/.gemini/commands/opal/design.toml',
  'payload/.github/prompts/opal-design.prompt.md'
)

$designRules = @(
  'spec-authoring-instructions.md',
  'requirements.md',
  'design.md',
  'Do not implement code',
  'Do not create',
  'tasks.md',
  'Goals / Non-Goals',
  'Decisions',
  'Runtime Component Flow Diagram',
  'Correctness',
  'Requirements',
  '/opal:playback',
  '/opal:tasks',
  '/opal:build'
)

foreach ($wrapper in $designWrappers) {
  Assert-Contains -RelativePath $wrapper -Needles $designRules -Label 'Design wrapper'
}

$preflightWrappers = @(
  'payload/.opal/runtime/prompts/preflight.prompt.md',
  'payload/.opal/runtime/codex-prompts/opal-preflight.md',
  'payload/.claude/commands/opal/preflight.md',
  'payload/.cursor/commands/opal-preflight.md',
  'payload/.gemini/commands/opal/preflight.toml',
  'payload/.github/prompts/opal-preflight.prompt.md'
)

$preflightRules = @(
  'spec-authoring-instructions.md',
  'preflight-instructions.md',
  'requirements.md',
  'design.md',
  'design stage',
  'tasks',
  'relevant source files',
  'requirement coverage',
  'architecture fit',
  'interface/data risks',
  'error handling',
  'testing gaps',
  'sequencing',
  'security/privacy',
  'maintainability',
  'findings',
  'key improvements',
  'questions',
  'residual risk',
  'Do not edit',
  'Do not implement code'
)

foreach ($wrapper in $preflightWrappers) {
  Assert-Contains -RelativePath $wrapper -Needles $preflightRules -Label 'Preflight wrapper'
}

$documentWrappers = @(
  'payload/.opal/runtime/prompts/document.prompt.md',
  'payload/.opal/runtime/codex-prompts/opal-document.md',
  'payload/.claude/commands/opal/document.md',
  'payload/.cursor/commands/opal-document.md',
  'payload/.gemini/commands/opal/document.toml',
  'payload/.github/prompts/opal-document.prompt.md'
)

$documentRules = @(
  'spec-authoring-instructions.md',
  'document-instructions.md',
  'active spec',
  'topic',
  '.opal/docs/<topic>.md',
  'implementation files',
  'Related specs',
  'update marker',
  'Audience is humans',
  'Do not restate',
  'Do not silently restructure',
  'Do not implement code'
)

foreach ($wrapper in $documentWrappers) {
  Assert-Contains -RelativePath $wrapper -Needles $documentRules -Label 'Document wrapper'
}

$buildWrappers = @(
  'payload/.opal/runtime/prompts/build.prompt.md',
  'payload/.opal/runtime/codex-prompts/opal-build.md',
  'payload/.claude/commands/opal/build.md',
  'payload/.cursor/commands/opal-build.md',
  'payload/.gemini/commands/opal/build.toml',
  'payload/.github/prompts/opal-build.prompt.md'
)

$buildRules = @(
  'spec-authoring-instructions.md',
  'change-protocol.md',
  'requirements.md',
  'design.md',
  'tasks.md',
  'present',
  'absent',
  'update',
  'checkbox',
  'verification',
  '/opal:document',
  'building reveals',
  'Do not edit specs'
)

foreach ($wrapper in $buildWrappers) {
  Assert-Contains -RelativePath $wrapper -Needles $buildRules -Label 'Build wrapper'
}

if ($failures.Count -gt 0) {
  Write-Host 'OpalSpec release consistency check failed:' -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "OpalSpec release consistency check passed for version $version." -ForegroundColor Green
