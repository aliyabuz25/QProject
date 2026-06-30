package com.haldun.kidsbiblestories;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "BackgroundNotifications",
        permissions = @Permission(
                alias = "notifications",
                strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
)
public final class BackgroundNotificationsPlugin extends Plugin {

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        NotificationWorker.createNotificationChannel(getContext());
        NotificationScheduler.setEnabled(getContext(), enabled);

        if (enabled
                && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }

        resolveState(call);
    }

    @PluginMethod
    public void checkNow(PluginCall call) {
        NotificationScheduler.checkNow(getContext());
        call.resolve();
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            NotificationScheduler.checkNow(getContext());
        }
        resolveState(call);
    }

    private void resolveState(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", NotificationScheduler.isEnabled(getContext()));
        result.put(
                "permissionGranted",
                Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                        || getPermissionState("notifications") == PermissionState.GRANTED
        );
        call.resolve(result);
    }
}
