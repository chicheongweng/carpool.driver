Building Android driver app:
1. install the following plugins:
    ionic plugin add ios.json
    ionic plugin add fetch.json
    ionic plugin add com.shazron.cordova.plugin.keychainutil
    ionic plugin add de.neofonie.cordova.plugin.nativeaudio
    ionic plugin add org.apache.cordova.geolocation
    ionic plugin add org.apache.cordova.network-information
    ionic plugin add com.shazron.cordova.plugin.keychainutil
2. mkdir platforms; ionic platforms add android
3. copy AndroidManifest.xml platforms/android/
4. ionic build android
5. ionic run android --target=5d0f4689

Making Mac recognize Android Samsung Galaxy S5:
1. Added device id to .android/adb_usb.ini one device per line
cat .android/adb_usb.ini
# USE 'android update adb' TO GENERATE.
0x04e8
2. Turn on USD debugging on Android
3. adb devices should show devices. If not restarting adb by
   adb kill-server
   adb start-server
