package com.wyc915.tallydew;

import android.graphics.Color;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Paints the system-bar areas (status bar on top, gesture/nav bar at the bottom) to match the
 * in-app theme, which can differ from the system theme. The WebView sits inside those bars
 * (android.adjustMarginsForEdgeToEdge = force), so the strips show the window background.
 */
@CapacitorPlugin(name = "NavBar")
public class NavBarPlugin extends Plugin {

    private Boolean lastDark = null;
    private int lastColor;

    @PluginMethod
    public void setStyle(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        String color = call.getString("color", dark ? "#0B1210" : "#F4F8F6");
        int c;
        try {
            c = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            call.reject("Invalid color: " + color);
            return;
        }
        lastDark = dark;
        lastColor = c;
        getActivity().runOnUiThread(() -> {
            apply(dark, c);
            call.resolve();
        });
    }

    /** the system can re-apply the theme's bar appearance (e.g. after the splash screen or when resuming) */
    @Override
    protected void handleOnResume() {
        if (lastDark != null) getActivity().runOnUiThread(() -> apply(lastDark, lastColor));
    }

    private void apply(boolean dark, int color) {
        Window window = getActivity().getWindow();
        window.getDecorView().setBackgroundColor(color);
        window.setStatusBarColor(color); // ignored where bars are transparent; harmless elsewhere
        window.setNavigationBarColor(color);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        // light bars => dark icons / handle, and vice versa
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }
}
