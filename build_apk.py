"""
Build a fully offline APK from the dist/ folder.
Requires: Android SDK, JDK 17
"""
import os, shutil, subprocess, sys

ANDROID_SDK = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk")
BUILD_TOOLS = os.path.join(ANDROID_SDK, "build-tools", "37.0.0")
PLATFORM = os.path.join(ANDROID_SDK, "platforms", "android-36.1")
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
DIST_DIR = "dist"
WORK_DIR = "apk_build"
PACKAGE_NAME = "com.vocab2000.app"
APP_NAME = "托福2000词"

os.makedirs(WORK_DIR, exist_ok=True)

# --- Step 1: Create AndroidManifest.xml ---
manifest = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{PACKAGE_NAME}"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="{APP_NAME}"
        android:icon="@drawable/icon"
        android:theme="@android:style/Theme.Material.Light.NoActionBar"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""

with open(os.path.join(WORK_DIR, "AndroidManifest.xml"), "w", encoding="utf-8") as f:
    f.write(manifest)

# --- Step 2: Create minimal resource tree ---
res_dir = os.path.join(WORK_DIR, "res")
os.makedirs(os.path.join(res_dir, "values"), exist_ok=True)
os.makedirs(os.path.join(res_dir, "drawable"), exist_ok=True)

with open(os.path.join(res_dir, "values", "strings.xml"), "w", encoding="utf-8") as f:
    f.write(f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">{APP_NAME}</string>\n</resources>\n')

# Generate a minimal PNG icon
import struct, zlib
def create_png(size):
    """Create a minimal solid-color PNG"""
    raw = b""
    for y in range(size):
        raw += b"\x00"  # filter byte
        for x in range(size):
            # Teal-ish color (RGBA)
            raw += b"\x0f\xb9\x81\xff"
    compressed = zlib.compress(raw)

    def chunk(ctype, data):
        c = ctype + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")

for name, sz in [("icon.png", 192), ("ic_launcher.png", 96)]:
    with open(os.path.join(res_dir, "drawable", name), "wb") as f:
        f.write(create_png(sz))

# --- Step 3: Compile resources with aapt2 ---
aapt2 = os.path.join(BUILD_TOOLS, "aapt2.exe")
compiled_res = os.path.join(WORK_DIR, "compiled.flata")
apk_res = os.path.join(WORK_DIR, "resources.apk")

subprocess.run([
    aapt2, "compile",
    "-o", compiled_res,
    "--dir", res_dir,
], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

subprocess.run([
    aapt2, "link",
    "-o", apk_res,
    "-I", os.path.join(PLATFORM, "android.jar"),
    "--manifest", os.path.join(WORK_DIR, "AndroidManifest.xml"),
    compiled_res,
    "--auto-add-overlay",
], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

# --- Step 4: Create Java source for WebView activity ---
java_dir = os.path.join(WORK_DIR, "java", PACKAGE_NAME.replace(".", os.sep))
os.makedirs(java_dir, exist_ok=True)

main_activity = f"""package {PACKAGE_NAME};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import android.os.Build;

public class MainActivity extends Activity {{
    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);

        // Draw behind system bars but keep them visible (no fullscreen hide)
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        WebView webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#faf7f2"));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.loadUrl("file:///android_asset/index.html");
    }}
}}
"""

with open(os.path.join(java_dir, "MainActivity.java"), "w", encoding="utf-8") as f:
    f.write(main_activity)

# --- Step 5: Compile Java ---
javac = os.path.join(JAVA_HOME, "bin", "javac.exe")
classes_dir = os.path.join(WORK_DIR, "classes")
os.makedirs(classes_dir, exist_ok=True)

android_jar = os.path.join(PLATFORM, "android.jar")

subprocess.run([
    javac,
    "-source", "1.8",
    "-target", "1.8",
    "-bootclasspath", android_jar,
    "-d", classes_dir,
    os.path.join(java_dir, "MainActivity.java"),
], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

# --- Step 6: Convert to DEX ---
d8 = os.path.join(BUILD_TOOLS, "d8.bat")
dex_dir = os.path.join(WORK_DIR, "dex")
os.makedirs(dex_dir, exist_ok=True)

subprocess.run([
    d8,
    "--lib", android_jar,
    "--output", dex_dir,
    "--min-api", "26",
    os.path.join(classes_dir, PACKAGE_NAME.replace(".", os.sep), "MainActivity.class"),
], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

# --- Step 7: Package APK ---
# Unzip the resources.apk (which is a proto-APK), add assets and dex
import zipfile

base_dir = os.path.join(WORK_DIR, "base")
if os.path.exists(base_dir):
    shutil.rmtree(base_dir)
os.makedirs(base_dir, exist_ok=True)

# Extract resources.apk
with zipfile.ZipFile(apk_res, 'r') as z:
    z.extractall(base_dir)

# Add dex files
for f in os.listdir(dex_dir):
    if f.endswith(".dex"):
        shutil.copy(os.path.join(dex_dir, f), os.path.join(base_dir, f))

# Copy web assets
assets_dir = os.path.join(base_dir, "assets")
if os.path.exists(assets_dir):
    shutil.rmtree(assets_dir)
shutil.copytree(DIST_DIR, assets_dir)

# Patch index.html: convert absolute paths to relative paths for file:// protocol
index_html = os.path.join(assets_dir, "index.html")
if os.path.exists(index_html):
    import re
    with open(index_html, "r", encoding="utf-8") as f:
        html = f.read()
    # Change href="/..." and src="/..." to href="./..." and src="./..."
    html = re.sub(r'(href|src)="/', r'\1="./', html)
    with open(index_html, "w", encoding="utf-8") as f:
        f.write(html)
    print("Patched index.html for file:// protocol")

# Warn if dist is empty
html_files = [f for f in os.listdir(assets_dir) if f.endswith('.html')]
if not html_files:
    print("WARNING: No HTML files found in dist/")

# Re-pack into APK
unsigned_apk = os.path.join(WORK_DIR, "app-unsigned.apk")
with zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(base_dir):
        for fn in files:
            full = os.path.join(root, fn)
            arcname = os.path.relpath(full, base_dir).replace("\\", "/")
            # Skip META-INF sig files if any
            if arcname.startswith("META-INF/") and ("CERT" in arcname or "MANIFEST" in arcname):
                continue
            z.write(full, arcname)

# --- Step 8: Align APK ---
aligned_apk = os.path.join(WORK_DIR, "app-aligned.apk")
zipalign = os.path.join(BUILD_TOOLS, "zipalign.exe")
subprocess.run([zipalign, "-p", "4", unsigned_apk, aligned_apk], check=True)

# --- Step 9: Sign APK ---
# Generate a debug keystore if not exists
keystore = os.path.join(WORK_DIR, "debug.keystore")
if not os.path.exists(keystore):
    keytool = os.path.join(JAVA_HOME, "bin", "keytool.exe")
    subprocess.run([
        keytool, "-genkey", "-v",
        "-keystore", keystore,
        "-alias", "debug",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", "android",
        "-keypass", "android",
        "-dname", "CN=Debug,O=VocabApp,C=CN",
    ], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

final_apk = "托福2000词.apk"
apksigner = os.path.join(BUILD_TOOLS, "apksigner.bat")
subprocess.run([
    apksigner, "sign",
    "--ks", keystore,
    "--ks-pass", "pass:android",
    "--ks-key-alias", "debug",
    "--out", final_apk,
    aligned_apk,
], check=True, env={**os.environ, "JAVA_HOME": JAVA_HOME})

# Clean up
shutil.rmtree(WORK_DIR, ignore_errors=True)

size_mb = os.path.getsize(final_apk) / (1024 * 1024)
try:
    print(f"\nAPK build complete: {final_apk}")
except UnicodeEncodeError:
    print(f"\nAPK build complete: {final_apk.encode('ascii', 'replace').decode()}")
print(f"   Size: {size_mb:.1f} MB")
print(f"\nTransfer the APK to your phone and install it.")
print(f"If prompted about 'unknown sources', allow it in Settings.")
