$env:Path = "$env:APPDATA\fnm\node-versions\v24.18.0\installation;$env:Path"

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

Remove-Item Env:\PORT -ErrorAction SilentlyContinue
pnpm dev
