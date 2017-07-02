:: Makes drup and installs it on windows.

@ECHO OFF

FOR /F "tokens=* USEBACKQ" %%F IN (`npm pack`) DO (
SET druptar=%%F
)

call npm install -g %druptar%

call del /F %%druptar%%
echo Drup dev version installed.