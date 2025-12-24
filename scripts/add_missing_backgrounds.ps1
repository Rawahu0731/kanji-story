$path = "c:\Users\PC_User\Documents\GitHub\kanji-story\public\story.json"
$json = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($chapter in $json.chapters) {
    $lastBg = ""
    foreach ($dialogue in $chapter.dialogues) {
        if ($dialogue.background) {
            $lastBg = $dialogue.background
        } elseif ($lastBg) {
            Add-Member -InputObject $dialogue -MemberType NoteProperty -Name "background" -Value $lastBg
        }
    }
}

$json | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
