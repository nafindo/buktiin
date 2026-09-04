package com.nafindo.buktiin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GallerySaverPlugin.class);
        super.onCreate(savedInstanceState);
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
