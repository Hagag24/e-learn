Param(
  [int]$Port = 5503,
  [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Server running at $prefix"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $local = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($local)) { $local = 'index.html' }
    $path = Join-Path $Root $local
    if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }
    if (-not (Test-Path $path)) {
      $ctx.Response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not Found')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $ctx.Response.Close()
      continue
    }
    $bytes = [IO.File]::ReadAllBytes($path)
    if ($path -match '\.html$') { $ctx.Response.ContentType = 'text/html' }
    elseif ($path -match '\.css$') { $ctx.Response.ContentType = 'text/css' }
    elseif ($path -match '\.js$') { $ctx.Response.ContentType = 'application/javascript' }
    elseif ($path -match '\.png$') { $ctx.Response.ContentType = 'image/png' }
    elseif ($path -match '\.jpe?g$') { $ctx.Response.ContentType = 'image/jpeg' }
    else { $ctx.Response.ContentType = 'application/octet-stream' }
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
  } catch {
    Write-Host $_.Exception.Message
  }
}