package com.haldun.kidsbiblestories;

import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LegalWebView")
public final class LegalWebViewPlugin extends Plugin {
    private static final String TERMS_URL =
            "file:///android_asset/public/legal/terms-and-conditions.html";

    private Dialog activeDialog;

    @PluginMethod
    public void openTerms(PluginCall call) {
        getActivity().runOnUiThread(this::showTermsDialog);
        call.resolve();
    }

    private void showTermsDialog() {
        if (activeDialog != null && activeDialog.isShowing()) return;

        final Dialog dialog = new Dialog(getActivity(), R.style.LegalWebViewDialogTheme);
        activeDialog = dialog;

        LinearLayout root = new LinearLayout(getContext());
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(13, 13, 13));

        FrameLayout toolbar = new FrameLayout(getContext());
        toolbar.setBackgroundColor(Color.rgb(13, 13, 13));
        toolbar.setPadding(dp(8), 0, dp(8), 0);
        root.addView(toolbar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(56)
        ));

        TextView title = new TextView(getContext());
        title.setText("Terms & Conditions");
        title.setTextColor(Color.WHITE);
        title.setTextSize(18);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        toolbar.addView(title, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        TextView close = new TextView(getContext());
        close.setText("×");
        close.setTextColor(Color.WHITE);
        close.setTextSize(32);
        close.setGravity(Gravity.CENTER);
        close.setContentDescription("Close Terms and Conditions");
        close.setBackgroundColor(Color.TRANSPARENT);
        close.setOnClickListener(view -> dialog.dismiss());
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(dp(48), dp(48));
        closeParams.gravity = Gravity.END | Gravity.CENTER_VERTICAL;
        toolbar.addView(close, closeParams);

        ProgressBar progress = new ProgressBar(
                getContext(),
                null,
                android.R.attr.progressBarStyleHorizontal
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            progress.getProgressDrawable().setTint(Color.rgb(254, 195, 72));
        }
        root.addView(progress, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(2)
        ));

        WebView webView = new WebView(getContext());
        webView.setBackgroundColor(Color.rgb(13, 13, 13));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(false);
        settings.setDomStorageEnabled(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }
        });
        root.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        dialog.setContentView(root);
        dialog.setOnShowListener(ignored -> {
            if (dialog.getWindow() == null) return;
            dialog.getWindow().setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
            dialog.getWindow().setGravity(Gravity.BOTTOM);
            dialog.getWindow().setStatusBarColor(Color.rgb(13, 13, 13));
            dialog.getWindow().setNavigationBarColor(Color.rgb(13, 13, 13));
        });
        dialog.setOnDismissListener(ignored -> {
            webView.stopLoading();
            webView.destroy();
            if (activeDialog == dialog) activeDialog = null;
        });

        webView.loadUrl(TERMS_URL);
        dialog.show();
    }

    private int dp(int value) {
        return Math.round(value * getContext().getResources().getDisplayMetrics().density);
    }
}
