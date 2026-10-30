# Rebuilds the research report: DOCX via python-docx, then fields/TOC update and PDF export via Microsoft Word.
# Usage (from the repo root):  powershell -File report/export_pdf.ps1
$root = Split-Path -Parent $PSScriptRoot
$docx = Join-Path $root 'docs\research-report.docx'
$pdf  = Join-Path $root 'docs\research-report.pdf'

python (Join-Path $PSScriptRoot 'build.py') $docx
if (-not $?) { exit 1 }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open($docx)
    $doc.Fields.Update() | Out-Null
    foreach ($t in $doc.TablesOfContents) { $t.Update() }
    foreach ($t in $doc.TablesOfFigures) { $t.Update() }
    $doc.Repaginate()
    foreach ($t in $doc.TablesOfContents) { $t.UpdatePageNumbers() }
    foreach ($t in $doc.TablesOfFigures) { $t.UpdatePageNumbers() }
    $doc.SaveAs2($docx, 16)                 # wdFormatDocumentDefault
    $doc.ExportAsFixedFormat($pdf, 17)      # wdExportFormatPDF
    $doc.Close()
} finally {
    $word.Quit()
}
Write-Output "Wrote $docx and $pdf"
