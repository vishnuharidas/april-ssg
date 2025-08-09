@echo off
setlocal
set CMD=%1
if "%CMD%"=="" set CMD=build
set CONTENT=%2
if "%CONTENT%"=="" set CONTENT=content

if /I "%CMD%"=="build" (
  node "%~dp0build.js" "%CONTENT%"
  exit /b %ERRORLEVEL%
) else if /I "%CMD%"=="preview" (
  node "%~dp0preview.js" "%CONTENT%"
  exit /b %ERRORLEVEL%
) else if /I "%CMD%"=="-h" (
  echo April^·SSG
  echo Usage:
  echo   april-ssg build [contentDir]
  echo   april-ssg preview [contentDir]
  exit /b 0
) else (
  echo Unknown command: %CMD% 1>&2
  exit /b 1
)
