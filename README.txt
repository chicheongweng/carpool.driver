steps to install:
1. ionic state reset
2. ionic build ios
3. ionic build android
4. ionic run ios -l -c -s
   ionic run ios --device -l -c -s
   ionic run android -l -c -s

Making Mac recognize Android Samsung Galaxy S5:
1. Added device id to .android/adb_usb.ini one device per line
cat .android/adb_usb.ini
# USE 'android update adb' TO GENERATE.
0x04e8
2. Turn on USD debugging on Android
3. adb devices should show devices. If not restarting adb by
adb kill-server
adb start-server
