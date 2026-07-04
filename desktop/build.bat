@echo off
set SIGNTOOL_PATH=D:\buktiin\desktop\build\dummy-signtool.bat
set WIN_CSC_LINK=
set CSC_IDENTITY_AUTO_DISCOVERY=false
if exist dist_new rmdir /s /q dist_new
node_modules\.bin\electron-builder.cmd
exit %errorlevel%
