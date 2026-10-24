#!/usr/bin/env bash
set -e

echo "=== Building AttendX Pro Android APK ==="

ROOT_DIR="$(pwd)"
BUILD_DIR="$ROOT_DIR/scripts/android-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/src/com/attendx/app
mkdir -p "$BUILD_DIR"/res/values
mkdir -p "$BUILD_DIR"/res/drawable
mkdir -p "$BUILD_DIR"/res/mipmap-hdpi
mkdir -p "$BUILD_DIR"/bin
mkdir -p "$BUILD_DIR"/gen
mkdir -p "$BUILD_DIR"/assets
mkdir -p "$ROOT_DIR"/public
mkdir -p "$ROOT_DIR"/dist

PLATFORM_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX="/usr/lib/android-sdk/build-tools/debian/dx"

# 1. AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR"/AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.attendx.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 2. Strings
cat << 'EOF' > "$BUILD_DIR"/res/values/strings.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AttendX Pro</string>
</resources>
EOF

# 3. Generate icon
python3 -c "
import struct, zlib

def make_png(w, h, color=(79, 70, 229, 255)):
    raw = b''
    for y in range(h):
        raw += b'\x00' + (bytes(color) * w)
    compressed = zlib.compress(raw)
    png = b'\x89PNG\r\n\x1a\n'
    png += struct.pack('>I4s', 13, b'IHDR') + struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png += struct.pack('>I', zlib.crc32(b'IHDR' + struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)))
    png += struct.pack('>I4s', len(compressed), b'IDAT') + compressed
    png += struct.pack('>I', zlib.crc32(b'IDAT' + compressed))
    png += struct.pack('>I4s', 0, b'IEND') + struct.pack('>I', zlib.crc32(b'IEND'))
    return png

with open('$BUILD_DIR/res/drawable/ic_launcher.png', 'wb') as f:
    f.write(make_png(72, 72))
"

# 4. Java Source Code
cat << 'EOF' > "$BUILD_DIR"/src/com/attendx/app/MainActivity.java
package com.attendx.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_URL = "https://ais-dev-x7peetdzotyrqukzksmpkp-570498639008.asia-northeast1.run.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout layout = new FrameLayout(this);
        webView = new WebView(this);
        layout.addView(webView);
        setContentView(layout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl(APP_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

# 5. Compile resources with aapt
echo "Packaging Android resources with aapt..."
aapt package -f -m \
    -J "$BUILD_DIR"/gen \
    -M "$BUILD_DIR"/AndroidManifest.xml \
    -S "$BUILD_DIR"/res \
    -I "$PLATFORM_JAR"

# 6. Compile Java code
echo "Compiling Java sources..."
javac -source 1.8 -target 1.8 -cp "$PLATFORM_JAR" \
    -d "$BUILD_DIR"/bin \
    "$BUILD_DIR"/gen/com/attendx/app/R.java \
    "$BUILD_DIR"/src/com/attendx/app/MainActivity.java

# 7. Convert bytecode to Dalvik dex
echo "Converting bytecode to Dalvik classes.dex..."
"$DX" --dex --output="$BUILD_DIR"/bin/classes.dex "$BUILD_DIR"/bin

# 8. Package APK
echo "Packaging APK..."
aapt package -f \
    -M "$BUILD_DIR"/AndroidManifest.xml \
    -S "$BUILD_DIR"/res \
    -I "$PLATFORM_JAR" \
    -F "$BUILD_DIR"/bin/app-unaligned.apk

# Add classes.dex into APK
(cd "$BUILD_DIR"/bin && zip -u app-unaligned.apk classes.dex)

# 9. Generate keystore if not exists
KEYSTORE="$ROOT_DIR/scripts/release-key.jks"
if [ ! -f "$KEYSTORE" ]; then
    echo "Generating release keystore..."
    keytool -genkey -v -keystore "$KEYSTORE" \
        -alias attendx \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass attendx123 -keypass attendx123 \
        -dname "CN=AttendX Pro, OU=Engineering, O=AttendX, L=Global, ST=Global, C=US"
fi

# 10. Sign APK
echo "Signing release APK with apksigner..."
apksigner sign --ks "$KEYSTORE" \
    --ks-key-alias attendx \
    --ks-pass pass:attendx123 \
    --key-pass pass:attendx123 \
    --out "$ROOT_DIR"/public/attendx-pro.apk \
    "$BUILD_DIR"/bin/app-unaligned.apk

# 11. Verify APK signature
echo "Verifying signed APK..."
apksigner verify --verbose "$ROOT_DIR"/public/attendx-pro.apk

# Copy to dist as well
cp "$ROOT_DIR"/public/attendx-pro.apk "$ROOT_DIR"/dist/attendx-pro.apk

echo "=== SUCCESS! Real Android APK generated: $ROOT_DIR/public/attendx-pro.apk ==="
ls -lh "$ROOT_DIR"/public/attendx-pro.apk
