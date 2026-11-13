package com.wyc915.diandi;

import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavBarPlugin.class);
        registerPlugin(SecurePlugin.class);
        super.onCreate(savedInstanceState);
        // Keep balances out of the app-switcher thumbnail. The in-app privacy cover is drawn from JS
        // on "pause", which can be too late for the snapshot; this blanks it natively (Android 13+)
        // while still allowing the user's own screenshots.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) setRecentsScreenshotEnabled(false);
    }
}
