!macro customInstall
    WriteRegStr HKLM "Software\Classes\Applications\${APP_FILENAME}.exe\shell\open\command" "" '"$INSTDIR\${APP_FILENAME}.exe" "%1"'
    WriteRegStr HKLM "Software\Classes\FrameShot.Image\shell\open\command" "" '"$INSTDIR\${APP_FILENAME}.exe" "%1"'
    WriteRegStr HKLM "Software\Classes\FrameShot.Image\DefaultIcon" "" '"$INSTDIR\${APP_FILENAME}.exe",0'
    !insertmacro RegisterExtensions
!macroend

!macro customUnInit
    !insertmacro UnregisterExtensions
    DeleteRegKey HKLM "Software\Classes\Applications\${APP_FILENAME}.exe\shell"
    DeleteRegKey HKLM "Software\Classes\FrameShot.Image"
!macroend

!macro RegisterExtension EXT
    WriteRegStr HKLM "Software\Classes\Applications\${APP_FILENAME}.exe\SupportedTypes" ".${EXT}" ""
    WriteRegStr HKLM "Software\Classes\.${EXT}\OpenWithProgids" "FrameShot.Image" ""
!macroend

!macro UnregisterExtension EXT
    DeleteRegValue HKLM "Software\Classes\Applications\${APP_FILENAME}.exe\SupportedTypes" ".${EXT}"
    DeleteRegValue HKLM "Software\Classes\.${EXT}\OpenWithProgids" "FrameShot.Image"
!macroend

!macro RegisterExtensions
    !insertmacro RegisterExtension "jpg"
    !insertmacro RegisterExtension "jpeg"
    !insertmacro RegisterExtension "png"
    !insertmacro RegisterExtension "webp"
    !insertmacro RegisterExtension "gif"
    !insertmacro RegisterExtension "avif"
    !insertmacro RegisterExtension "bmp"
    !insertmacro RegisterExtension "svg"
    !insertmacro RegisterExtension "heic"
    !insertmacro RegisterExtension "heif"
    !insertmacro RegisterExtension "tiff"
    !insertmacro RegisterExtension "raw"
!macroend

!macro UnregisterExtensions
    !insertmacro UnregisterExtension "jpg"
    !insertmacro UnregisterExtension "jpeg"
    !insertmacro UnregisterExtension "png"
    !insertmacro UnregisterExtension "webp"
    !insertmacro UnregisterExtension "gif"
    !insertmacro UnregisterExtension "avif"
    !insertmacro UnregisterExtension "bmp"
    !insertmacro UnregisterExtension "svg"
    !insertmacro UnregisterExtension "heic"
    !insertmacro UnregisterExtension "heif"
    !insertmacro UnregisterExtension "tiff"
    !insertmacro UnregisterExtension "raw"
!macroend
