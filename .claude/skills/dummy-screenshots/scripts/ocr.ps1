# Windows built-in OCR: every word with its box. Usage (Windows PowerShell 5.1): powershell -File ocr.ps1 in.png out.json
# Feed it an inverted, 2.5x upscaled copy of a dark screenshot; divide the boxes by 2.5.
param($in, $out)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(); $task.Result }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($in)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$null = [Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
$res = Await ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
$words = foreach ($l in $res.Lines) { foreach ($w in $l.Words) { $r = $w.BoundingRect; [pscustomobject]@{ t = $w.Text; x = [int]$r.X; y = [int]$r.Y; w = [int]$r.Width; h = [int]$r.Height; line = $l.Text } } }
$words | ConvertTo-Json -Compress | Set-Content -Encoding UTF8 $out
"$in : $($words.Count) words, max dim $([Windows.Media.Ocr.OcrEngine]::MaxImageDimension)"
