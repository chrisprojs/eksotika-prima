@ECHO OFF

REM Loop through all subdirectories
FOR /R %%F IN (*.png *.jpeg) DO (
    REM Convert each PNG and JPEG to JPG
    magick convert "%%F" "%%~dpnF.jpg"
)

ECHO PNG and JPEG to JPG conversion complete!

PAUSE
