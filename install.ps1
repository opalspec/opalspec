[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$TargetRepo,

  [ValidateSet('codex','claude','cursor','gemini','github-copilot','plugin')]
  [Alias('Tools')]
  [string[]]$Tool,

  [switch]$InstallCodexPrompts,

  [string]$CodexHome = $env:CODEX_HOME,

  [switch]$Force,

  [switch]$Update
)

$ErrorActionPreference = 'Stop'

$packageRoot = $PSScriptRoot
$payloadRoot = Join-Path $packageRoot 'payload'

if (-not (Test-Path -LiteralPath $payloadRoot)) {
  throw "Missing payload directory: $payloadRoot"
}

# -Update implies -Force semantics for OpalSpec-owned files and refreshes the AGENTS.md block.
if ($Update) { $Force = $true }

function Get-OpalSpecVersion {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
  if ($null -eq $raw) { return $null }
  $value = $raw.Trim()
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  return $value
}

function Get-InstalledOpalSpecTools {
  param([Parameter(Mandatory = $true)][string]$Root)

  $installed = @()

  if (Test-Path -LiteralPath (Join-Path $Root '.codex\skills\opalspec')) {
    $installed += 'codex'
  }

  if (
    (Test-Path -LiteralPath (Join-Path $Root '.claude\commands\opal')) -or
    (Test-Path -LiteralPath (Join-Path $Root '.claude\skills\opalspec'))
  ) {
    $installed += 'claude'
  }

  $cursorCommands = Join-Path $Root '.cursor\commands'
  if (
    (Test-Path -LiteralPath $cursorCommands) -and
    (
      (Test-Path -LiteralPath (Join-Path $cursorCommands 'opal-new.md')) -or
      (Test-Path -LiteralPath (Join-Path $cursorCommands 'opal-design.md'))
    )
  ) {
    $installed += 'cursor'
  }

  if (Test-Path -LiteralPath (Join-Path $Root '.gemini\commands\opal')) {
    $installed += 'gemini'
  }

  $githubPrompts = Join-Path $Root '.github\prompts'
  if (
    (Test-Path -LiteralPath $githubPrompts) -and
    (
      (Test-Path -LiteralPath (Join-Path $githubPrompts 'opal-new.prompt.md')) -or
      (Test-Path -LiteralPath (Join-Path $githubPrompts 'opal-design.prompt.md'))
    )
  ) {
    $installed += 'github-copilot'
  }

  $marketplacePath = Join-Path $Root '.agents\plugins\marketplace.json'
  $hasOpalSpecMarketplaceEntry = $false
  if (Test-Path -LiteralPath $marketplacePath) {
    try {
      $marketplace = Get-Content -LiteralPath $marketplacePath -Raw -Encoding UTF8 | ConvertFrom-Json
      $hasOpalSpecMarketplaceEntry = @($marketplace.plugins | Where-Object { $_.name -eq 'opalspec' }).Count -gt 0
    } catch {
      $marketplaceRaw = Get-Content -LiteralPath $marketplacePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
      $hasOpalSpecMarketplaceEntry = $marketplaceRaw -match '"name"\s*:\s*"opalspec"'
    }
  }

  if (
    (Test-Path -LiteralPath (Join-Path $Root 'plugins\opalspec')) -or
    $hasOpalSpecMarketplaceEntry
  ) {
    $installed += 'plugin'
  }

  return @($installed | Select-Object -Unique)
}

$payloadVersionPath = Join-Path $payloadRoot '.opal\VERSION'
$payloadVersion = Get-OpalSpecVersion -Path $payloadVersionPath
if (-not $payloadVersion) { $payloadVersion = 'unknown' }

if ([System.IO.Path]::IsPathRooted($TargetRepo)) {
  $targetRoot = [System.IO.Path]::GetFullPath($TargetRepo)
} else {
  $targetRoot = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $TargetRepo))
}

$requestedTools = @()
if ($Tool) {
  $requestedTools = @($Tool | Select-Object -Unique)
}

if ((-not $Update) -and $requestedTools.Count -eq 0) {
  throw 'You must specify at least one -Tool value unless running -Update against an existing OpalSpec install.'
}

if ($Update -and $requestedTools.Count -eq 0 -and -not (Test-Path -LiteralPath $targetRoot)) {
  throw 'Target repository does not exist. For a first install, pass -Tool <name>.'
}

if (-not (Test-Path -LiteralPath $targetRoot)) {
  if ($PSCmdlet.ShouldProcess($targetRoot, 'Create target repository directory')) {
    New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
  }
}

$targetVersionPath = Join-Path $targetRoot '.opal\VERSION'
$existingVersion = Get-OpalSpecVersion -Path $targetVersionPath

if ($existingVersion) {
  if ($existingVersion -eq $payloadVersion) {
    Write-Host "OpalSpec $payloadVersion already installed at $targetRoot."
  } else {
    Write-Host "Updating OpalSpec in $targetRoot from $existingVersion to $payloadVersion."
  }
} else {
  Write-Host "Installing OpalSpec $payloadVersion to $targetRoot."
}

$effectiveTools = @()
if ($Update) {
  $installedTools = @(Get-InstalledOpalSpecTools -Root $targetRoot)
  if ($installedTools.Count -gt 0) {
    $effectiveTools = $installedTools
    Write-Host ("Update mode detected installed OpalSpec tool surfaces: {0}" -f ($effectiveTools -join ', '))
    if ($requestedTools.Count -gt 0) {
      Write-Host 'Ignoring -Tool during -Update; installed tool surfaces are refreshed automatically.'
    }
  } elseif ($requestedTools.Count -gt 0) {
    $effectiveTools = $requestedTools
    Write-Warning 'No installed OpalSpec tool surfaces were detected; falling back to the supplied -Tool values.'
  } else {
    throw 'No installed OpalSpec tool surfaces were detected. For a first install, pass -Tool <name>. For a partial install, pass -Tool <name> with -Update to choose the surfaces to install.'
  }
} else {
  if ($requestedTools.Count -eq 0) {
    throw 'You must specify at least one -Tool value unless running -Update against an existing OpalSpec install.'
  }
  $effectiveTools = $requestedTools
}

function Copy-OpalSpecItem {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][string]$DestinationRelativePath
  )

  $source = Join-Path $payloadRoot $RelativePath
  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Skipping missing payload path: $RelativePath"
    return
  }

  $destination = Join-Path $targetRoot $DestinationRelativePath
  $item = Get-Item -LiteralPath $source -Force

  if ($item.PSIsContainer) {
    if ((Test-Path -LiteralPath $destination) -and -not (Get-Item -LiteralPath $destination).PSIsContainer) {
      throw "Destination exists and is not a directory: $destination"
    }

    if ($PSCmdlet.ShouldProcess($destination, "Install directory $RelativePath")) {
      New-Item -ItemType Directory -Force -Path $destination | Out-Null
      Get-ChildItem -LiteralPath $source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force:$Force
      }
    }
    return
  }

  $parent = Split-Path -Parent $destination
  if ($PSCmdlet.ShouldProcess($destination, "Install file $RelativePath")) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force:$Force
  }
}

function Ensure-AgentsBlock {
  $source = Join-Path $payloadRoot 'AGENTS.opal.md'
  if (-not (Test-Path -LiteralPath $source)) { return }

  $target = Join-Path $targetRoot 'AGENTS.md'
  $blockStart = '<!-- OPALSPEC-INSTRUCTIONS-START -->'
  $blockEnd = '<!-- OPALSPEC-INSTRUCTIONS-END -->'
  $blockBody = (Get-Content -LiteralPath $source -Raw -Encoding UTF8).TrimEnd()
  $block = "$blockStart`n$blockBody`n$blockEnd"

  if (Test-Path -LiteralPath $target) {
    $existing = Get-Content -LiteralPath $target -Raw -Encoding UTF8
    if ($existing -like "*$blockStart*") {
      # Replace the block contents between markers, leaving everything outside untouched.
      $pattern = [Regex]::Escape($blockStart) + '.*?' + [Regex]::Escape($blockEnd)
      $regex = [System.Text.RegularExpressions.Regex]::new($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
      $updated = $regex.Replace($existing, { param($m) $block })
      if ($updated -ne $existing) {
        if ($PSCmdlet.ShouldProcess($target, 'Refresh OpalSpec AGENTS.md instructions block')) {
          Set-Content -LiteralPath $target -Value $updated -Encoding UTF8 -NoNewline
          Write-Host 'AGENTS.md OpalSpec block refreshed.'
        }
      } else {
        Write-Host 'AGENTS.md OpalSpec block already up to date.'
      }
      return
    }
    if ($PSCmdlet.ShouldProcess($target, 'Append OpalSpec AGENTS.md instructions')) {
      $appended = $existing.TrimEnd() + "`n`n" + $block + "`n"
      Set-Content -LiteralPath $target -Value $appended -Encoding UTF8 -NoNewline
    }
  } else {
    if ($PSCmdlet.ShouldProcess($target, 'Create AGENTS.md with OpalSpec instructions')) {
      Set-Content -LiteralPath $target -Value ($block + "`n") -Encoding UTF8 -NoNewline
    }
  }
}

function Install-CodexPrompts {
  if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $CodexHome = Join-Path $env:USERPROFILE '.codex'
  }

  $source = Join-Path $payloadRoot '.opal\runtime\codex-prompts'
  $target = Join-Path $CodexHome 'prompts'

  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Missing Codex prompt source: $source"
    return
  }

  if ($PSCmdlet.ShouldProcess($target, 'Install OpalSpec Codex prompts')) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -LiteralPath (Join-Path $source 'opal-new.md') -Destination (Join-Path $target 'opal-new.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-design.md') -Destination (Join-Path $target 'opal-design.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-preflight.md') -Destination (Join-Path $target 'opal-preflight.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-playback.md') -Destination (Join-Path $target 'opal-playback.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-tasks.md') -Destination (Join-Path $target 'opal-tasks.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-build.md') -Destination (Join-Path $target 'opal-build.md') -Force
    Copy-Item -LiteralPath (Join-Path $source 'opal-document.md') -Destination (Join-Path $target 'opal-document.md') -Force
  }
}

function Remove-StaleBuildRenamedCommands {
  $stalePaths = @(
    '.opal\runtime\prompts\implement.prompt.md',
    '.opal\runtime\codex-prompts\opal-implement.md'
  )

  if ($effectiveTools -contains 'claude') {
    $stalePaths += '.claude\commands\opal\implement.md'
  }

  if ($effectiveTools -contains 'cursor') {
    $stalePaths += '.cursor\commands\opal-implement.md'
  }

  if ($effectiveTools -contains 'gemini') {
    $stalePaths += '.gemini\commands\opal\implement.toml'
  }

  if ($effectiveTools -contains 'github-copilot') {
    $stalePaths += '.github\prompts\opal-implement.prompt.md'
  }

  foreach ($relativePath in $stalePaths) {
    $target = Join-Path $targetRoot $relativePath
    if (Test-Path -LiteralPath $target) {
      if ($PSCmdlet.ShouldProcess($target, 'Remove stale /opal:implement wrapper renamed to /opal:build')) {
        Remove-Item -LiteralPath $target -Force
        Write-Host "  Renamed: $relativePath -> build equivalent (removed stale copy)"
      }
    }
  }

  if ($InstallCodexPrompts) {
    if ([string]::IsNullOrWhiteSpace($CodexHome)) {
      $CodexHome = Join-Path $env:USERPROFILE '.codex'
    }

    $staleCodexPrompt = Join-Path (Join-Path $CodexHome 'prompts') 'opal-implement.md'
    if (Test-Path -LiteralPath $staleCodexPrompt) {
      if ($PSCmdlet.ShouldProcess($staleCodexPrompt, 'Remove stale Codex prompt renamed to opal-build.md')) {
        Remove-Item -LiteralPath $staleCodexPrompt -Force
        Write-Host '  Renamed: Codex prompt opal-implement.md -> opal-build.md (removed stale copy)'
      }
    }
  }
}

Remove-StaleBuildRenamedCommands
Copy-OpalSpecItem '.opal' '.opal'
Ensure-AgentsBlock

if ($effectiveTools -contains 'codex') {
  Copy-OpalSpecItem '.codex' '.codex'
}

if ($effectiveTools -contains 'claude') {
  Copy-OpalSpecItem '.claude\commands\opal' '.claude\commands\opal'
  Copy-OpalSpecItem '.claude\skills\opalspec' '.claude\skills\opalspec'
}

if ($effectiveTools -contains 'cursor') {
  Copy-OpalSpecItem '.cursor' '.cursor'
}

if ($effectiveTools -contains 'gemini') {
  Copy-OpalSpecItem '.gemini' '.gemini'
}

if ($effectiveTools -contains 'github-copilot') {
  Copy-OpalSpecItem '.github\prompts' '.github\prompts'
}

if ($effectiveTools -contains 'plugin') {
  Copy-OpalSpecItem 'plugins\opalspec' 'plugins\opalspec'
  Copy-OpalSpecItem '.agents' '.agents'
}

if ($InstallCodexPrompts) {
  Install-CodexPrompts
}

# Stamp installed version (whether new install, update, or no-op refresh).
if (Test-Path -LiteralPath $payloadVersionPath) {
  $targetVersionDir = Split-Path -Parent $targetVersionPath
  if ($PSCmdlet.ShouldProcess($targetVersionPath, "Write OpalSpec VERSION $payloadVersion")) {
    New-Item -ItemType Directory -Force -Path $targetVersionDir | Out-Null
    Set-Content -LiteralPath $targetVersionPath -Value $payloadVersion -Encoding UTF8 -NoNewline
  }
}

if ($existingVersion -and $existingVersion -ne $payloadVersion) {
  Write-Host "OpalSpec updated to $payloadVersion at $targetRoot (from $existingVersion)."
} else {
  Write-Host "OpalSpec $payloadVersion install complete for $targetRoot."
}
Write-Host 'Next: restart/reload your AI IDE if command or skill discovery does not update automatically.'
