package com.dungeon.descent;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

// A persistent, low-priority notification for glanceable status (Hunter
// distance, AFK-mode kill count, Void Reaper progress) while the game is
// running or briefly backgrounded — the Android half of the Live Activity
// idea. This is a plain ongoing notification, not backed by a dedicated
// foreground service, so it's simple and low-risk but will disappear if
// Android fully kills the app's process. A true foreground service would
// survive that, at the cost of a manifest-declared service + specific
// foregroundServiceType Google Play scrutinizes for justification — worth
// upgrading to later if the plain version proves too fragile in practice,
// not before.
@CapacitorPlugin(
    name = "GameStatusNotification",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class GameStatusNotificationPlugin extends Plugin {
    private static final String CHANNEL_ID = "dd_game_status";
    private static final int NOTIFICATION_ID = 4201;

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getContext().getSystemService(NotificationManager.class);
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Game Status", NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Live status while Dungeon Descent is running");
                manager.createNotificationChannel(channel);
            }
        }
    }

    @PluginMethod
    public void show(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "showPermsCallback");
            return;
        }
        doShow(call);
    }

    @PermissionCallback
    private void showPermsCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || getPermissionState("notifications") == PermissionState.GRANTED) {
            doShow(call);
        } else {
            call.reject("Notification permission was not granted");
        }
    }

    private void doShow(PluginCall call) {
        String title = call.getString("title", "Dungeon Descent");
        String text = call.getString("text", "");
        ensureChannel();
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(getContext().getApplicationInfo().icon)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);
        NotificationManagerCompat.from(getContext()).notify(NOTIFICATION_ID, builder.build());
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(NOTIFICATION_ID);
        call.resolve();
    }
}
