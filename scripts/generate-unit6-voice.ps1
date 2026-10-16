param([Parameter(Mandatory=$true)][string]$ModelRoot)
$ErrorActionPreference='Stop'
$taskPlanPath=Join-Path $PSScriptRoot 'unit6-voice-plan.json'
$taskRunnerPath=Join-Path $PSScriptRoot 'generate-unit6-voice.py'
$taskPythonPath=Join-Path $ModelRoot '.venv/Scripts/python.exe'
$taskVoicePlan=Get-Content -LiteralPath $taskPlanPath -Raw -Encoding UTF8 | ConvertFrom-Json
while(@($taskVoicePlan | Where-Object { Test-Path -LiteralPath $_.output }).Count -lt $taskVoicePlan.Count){
    & $taskPythonPath $taskRunnerPath --plan $taskPlanPath --root $ModelRoot --threads 4 --workers 1 --max-new 8
    if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
& node (Join-Path $PSScriptRoot 'prepare-unit6-voice.cjs')
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Output 'COMPLETE: all teacher speech files are ready.'
