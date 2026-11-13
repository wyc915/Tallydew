package com.wyc915.diandi;

import android.os.SystemClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Security helpers for the web layer.
 * clock(): a time source the user cannot rewind by changing the system date/time —
 * SystemClock.elapsedRealtime (monotonic, counts deep sleep) plus the boot count, so the
 * PIN lockout and auto-lock timers can't be skipped by moving the wall clock.
 */
@CapacitorPlugin(name = "Secure")
public class SecurePlugin extends Plugin {

    @PluginMethod
    public void clock(PluginCall call) {
        String boot;
        try {
            boot = String.valueOf(Settings.Global.getInt(getContext().getContentResolver(), Settings.Global.BOOT_COUNT));
        } catch (Settings.SettingNotFoundException e) {
            boot = "unknown";
        }
        JSObject r = new JSObject();
        r.put("boot", boot);
        r.put("ms", SystemClock.elapsedRealtime());
        call.resolve(r);
    }
}
