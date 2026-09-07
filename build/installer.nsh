!macro customInstall
  ; Updates can preserve existing shortcuts. Recreate them so both their icon source
  ; and AppUserModelID always match the newly installed executable.
  ${If} ${FileExists} "$newStartMenuLink"
    Delete "$newStartMenuLink"
    CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
  ${EndIf}

  ${If} ${FileExists} "$newDesktopLink"
    Delete "$newDesktopLink"
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
  ${EndIf}

  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend
