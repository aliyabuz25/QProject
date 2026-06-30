package com.haldun.kidsbiblestories;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

public final class NotificationWorker extends Worker {
    private static final String TAG = "NotificationWorker";
    private static final String API_URL = "http://54.196.133.35:3000/api/notifications";
    private static final String CHANNEL_ID = "kids_bible_updates";
    private static final String KEY_SHOWN_IDS = "shown_notification_ids";
    private static final int MAX_REMEMBERED_IDS = 500;
    private static final Object DEDUPLICATION_LOCK = new Object();

    public NotificationWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        if (!NotificationScheduler.isEnabled(context) || !canPostNotifications(context)) {
            return Result.success();
        }

        try {
            JSONArray notifications = fetchNotifications();
            createNotificationChannel(context);

            // Oldest first keeps the system tray in the same order as the API timeline.
            for (int index = notifications.length() - 1; index >= 0; index--) {
                JSONObject item = notifications.optJSONObject(index);
                if (item != null) showIfNew(context, item);
            }
            return Result.success();
        } catch (IOException error) {
            Log.w(TAG, "Notification API is temporarily unavailable", error);
            return Result.retry();
        } catch (Exception error) {
            Log.e(TAG, "Notification check failed", error);
            return Result.failure();
        }
    }

    private JSONArray fetchNotifications() throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(API_URL).openConnection();
        try {
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(15_000);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "bible-appclient");

            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                throw new IOException("Notification API returned HTTP " + status);
            }

            String response = readAll(connection.getInputStream());
            Object root = new JSONTokener(response).nextValue();
            if (root instanceof JSONArray) return (JSONArray) root;
            if (root instanceof JSONObject) {
                JSONObject object = (JSONObject) root;
                JSONArray data = object.optJSONArray("data");
                if (data != null) return data;
                JSONArray items = object.optJSONArray("notifications");
                if (items != null) return items;
            }
            return new JSONArray();
        } finally {
            connection.disconnect();
        }
    }

    private static String readAll(InputStream stream) throws IOException {
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        }
        return result.toString();
    }

    private static void showIfNew(Context context, JSONObject item) {
        String title = valueOr(item.optString("title"), context.getString(R.string.app_name));
        String message = valueOr(
                item.optString("message"),
                valueOr(item.optString("body"), "You have a new notification.")
        );
        String uniqueKey = notificationKey(item, title, message);

        synchronized (DEDUPLICATION_LOCK) {
            SharedPreferences preferences = NotificationScheduler.preferences(context);
            Set<String> shownIds = new HashSet<>(
                    preferences.getStringSet(KEY_SHOWN_IDS, new HashSet<>())
            );
            if (shownIds.contains(uniqueKey)) return;

            Intent launchIntent = new Intent(context, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent contentIntent = PendingIntent.getActivity(
                    context,
                    uniqueKey.hashCode(),
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setLargeIcon(BitmapFactory.decodeResource(
                            context.getResources(),
                            R.mipmap.ic_launcher_foreground
                    ))
                    .setColor(Color.rgb(254, 195, 72))
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setContentIntent(contentIntent);

            try {
                NotificationManager manager =
                        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                manager.notify(uniqueKey, 0, builder.build());

                if (shownIds.size() >= MAX_REMEMBERED_IDS) shownIds.clear();
                shownIds.add(uniqueKey);
                preferences.edit().putStringSet(KEY_SHOWN_IDS, shownIds).apply();
            } catch (SecurityException denied) {
                // Do not mark it as shown; it can be delivered after permission is granted.
                Log.w(TAG, "Notification permission is not granted", denied);
            }
        }
    }

    private static String notificationKey(JSONObject item, String title, String message) {
        Object id = item.opt("id");
        if (id != null && id != JSONObject.NULL && !String.valueOf(id).isEmpty()) {
            return "id:" + id;
        }
        return "content:" + title + "|" + message + "|" + item.optString("createdAt");
    }

    private static String valueOr(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static boolean canPostNotifications(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Kids Bible Stories updates",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("New messages and account updates");
        manager.createNotificationChannel(channel);
    }
}
