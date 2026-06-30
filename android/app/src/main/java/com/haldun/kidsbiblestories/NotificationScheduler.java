package com.haldun.kidsbiblestories;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

final class NotificationScheduler {
    static final String PREFERENCES = "kids_bible_notifications";
    static final String KEY_ENABLED = "enabled";

    private static final String PERIODIC_WORK = "kids-bible-notification-poll";
    private static final String IMMEDIATE_WORK = "kids-bible-notification-check-now";

    private NotificationScheduler() {}

    static boolean isEnabled(Context context) {
        return preferences(context).getBoolean(KEY_ENABLED, true);
    }

    static void setEnabled(Context context, boolean enabled) {
        preferences(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
        if (enabled) {
            schedule(context);
            checkNow(context);
        } else {
            WorkManager manager = WorkManager.getInstance(context);
            manager.cancelUniqueWork(PERIODIC_WORK);
            manager.cancelUniqueWork(IMMEDIATE_WORK);
        }
    }

    static void schedule(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                NotificationWorker.class,
                15,
                TimeUnit.MINUTES
        ).setConstraints(constraints).build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_WORK,
                ExistingPeriodicWorkPolicy.KEEP,
                request
        );
    }

    static void checkNow(Context context) {
        if (!isEnabled(context)) return;

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(NotificationWorker.class)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_WORK,
                ExistingWorkPolicy.REPLACE,
                request
        );
    }

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }
}
