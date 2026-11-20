package com.guitarshell;

import android.app.Activity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 把网页主题同步到 Android 系统栏。
 * 只改颜色和图标明暗，不动布局，也不参与 WebView 内容。
 */
@CapacitorPlugin(name = "ThemeBars")
public class ThemeBarsPlugin extends Plugin {

    @PluginMethod
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme", "deep");
        Activity activity = getActivity();
        if (!(activity instanceof MainActivity)) {
            call.reject("ThemeBars requires MainActivity");
            return;
        }
        activity.runOnUiThread(() -> ((MainActivity) activity).applyThemeSystemBars(theme));
        call.resolve();
    }
}
