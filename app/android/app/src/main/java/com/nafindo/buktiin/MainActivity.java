package com.nafindo.buktiin;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GallerySaverPlugin.class);
        super.onCreate(savedInstanceState);

        if (getPackageName().contains("admin")) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setSupportZoom(true);
                settings.setBuiltInZoomControls(true);
                settings.setDisplayZoomControls(false);
                settings.setUseWideViewPort(true);
                settings.setLoadWithOverviewMode(true);
                settings.setDomStorageEnabled(true);
                settings.setJavaScriptEnabled(true);

                webView.loadUrl("https://nafindo.github.io/buktiin/#/admin/dashboard");
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getPackageName().contains("admin")) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() -> {
                    getBridge().getWebView().evaluateJavascript(
                        "try { localStorage.setItem('is_admin_mode', 'true'); if (!window.location.hash.startsWith('#/admin')) { window.location.hash = '#/admin/dashboard'; } } catch(e){}",
                        null
                    );
                });
            }
        }
    }
}
