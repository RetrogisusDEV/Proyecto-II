[app]

# (str) Title of your application
title = Starnet App

# (str) Package name
package.name = starnetapp

# (str) Package domain (needed for android/ios packaging)
package.domain = org.starnet

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include (let empty to include all the files)
source.include_exts = py,png,jpg,kv,atlas,html,css,js

# (list) Source files to exclude (let empty to not exclude anything)
source.exclude_exts = spec

# (list) List of inclusions using pattern matching
# Importante: Incluir la carpeta src donde está tu HTML
source.include_patterns = src/*,src/css/*,src/js/*

# (str) Application version
version = 1.0.0

# (int) Application version code (for Android)
version.code = 1

# (str) Application version
# version = 1.0.0

# (list) Application requirements
# pywebview requiere python3, kivy y android como base
requirements = python3,kivy,pywebview,android,jnius

# (str) Custom source folders for requirements
# Sets custom source for any requirements with recipes
# requirements.source.kivy = ../../kivy

# (list) Permissions
android.permissions = INTERNET

# (int) Target Android API, should be as high as possible (usually 33+)
android.api = 33

# (int) Minimum API your APK will support.
android.minapi = 21

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 0

# (str) Presplash of the application
# presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon of the application
# icon.filename = %(source.dir)s/data/icon.png

# (str) Supported orientation (one of landscape, sensorLandscape, portrait or all)
orientation = portrait

# (bool) Copy library instead of making a libpymodules.so
# android.copy_libs = 1

# (list) The Android archs to build for, choices: armeabi-v7a, arm64-v8a, x86, x86_64
# Para subir a Play Store usa: arm64-v8a, armeabi-v7a
# Para probar en emulador suele ser x86_64
android.archs = armeabi-v7a

# (bool) enables Android auto backup feature (Android API >=23)
android.allow_backup = True

[buildozer]

# (int) Log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 0

# (int) Display warning if buildozer is run as root (0 = False, 1 = True)
warn_on_root = 1
