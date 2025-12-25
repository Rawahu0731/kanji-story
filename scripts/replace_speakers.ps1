Param(
    [string]$Path = "c:\Users\PC_User\Documents\GitHub\kanji-story\memo2.txt",
    [switch]$Preview,
    [int]$PreviewLines = 80,
    [switch]$NoBackup
)

$map = @{
    "太郎" = "黒沢冴白"
    "彁" = "もち子さん"
    "ナレーション" = "春日部つむぎ"
    "零" = "Voidoll"
    "焔" = "麒ヶ島宗麟"
    "老人" = "ちび式じい"
    "結" = "冥鳴ひまり"
    "守" = "No.7"
    "問" = "剣崎雌雄"
    "希" = "雨晴はう"
    "クラスメイト" = "ずんだもん"
}

if (-not (Test-Path $Path)) {
    Write-Error "File not found: $Path"
    exit 1
}

if (-not $NoBackup) {
    $backup = "$Path.bak"
    Copy-Item -Path $Path -Destination $backup -Force
}

# Import CSV (expects header 'speaker,text')
$data = Import-Csv -Path $Path -Encoding UTF8

foreach ($row in $data) {
    if ($map.ContainsKey($row.speaker)) {
        $row.speaker = $map[$row.speaker]
    }
}

if ($Preview) {
    $data | Select-Object -First $PreviewLines | Format-Table -AutoSize
    exit 0
}

# Write back (preserves CSV structure)
$data | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8

Write-Output "Replacements applied to $Path. Backup: $Path.bak"
