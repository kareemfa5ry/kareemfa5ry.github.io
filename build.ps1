# Compiles every CV in src/latex and copies the PDFs to public/assets/cv/ for the website.
# Usage:  ./build.ps1   (needs pdflatex from MiKTeX or TeX Live)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$src  = Join-Path $root 'src/latex'
$out  = Join-Path $root 'public/assets/cv'

Push-Location $src
try {
    Get-ChildItem *.tex | ForEach-Object {
        Write-Host "Building $($_.Name)..."
        # Two passes so hyperref links/bookmarks resolve
        foreach ($pass in 1..2) {
            pdflatex -interaction=nonstopmode -halt-on-error $_.Name | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "pdflatex failed on $($_.Name); see $($_.BaseName).log" }
        }
        Copy-Item "$($_.BaseName).pdf" $out -Force
    }
}
finally { Pop-Location }

Write-Host "Done. PDFs updated in public/assets/cv/"
