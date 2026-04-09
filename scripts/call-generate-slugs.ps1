$response = Invoke-WebRequest -Uri "https://www.tasheel.live/api/admin/generate-slugs" -Method POST -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
