package com.haldun.kidsbiblestories;

import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(GoogleAuthPlugin.class);
        registerPlugin(BackgroundNotificationsPlugin.class);
        registerPlugin(LegalWebViewPlugin.class);
        super.onCreate(savedInstanceState);

        if (bridge != null && bridge.getWebView() != null) {
            WebSettings settings = bridge.getWebView().getSettings();
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
