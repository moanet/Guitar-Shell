package com.guitarshell;

import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 屏幕常亮插件。
 *
 * 用原生 FLAG_KEEP_SCREEN_ON 而不是 PowerManager WakeLock：
 *   - 只在当前窗口可见时生效，不会在切后台后继续耗电；
 *   - 不需要 WAKE_LOCK 权限，也不会出现「拿了锁忘记释放」；
 *   - 与 WebView 内的页面生命周期天然对齐。
 */
@CapacitorPlugin(name = "KeepAwake")
public class KeepAwakePlugin extends Plugin {

    private boolean enabled = false;

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            enabled = true;
        });
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            enabled = false;
        });
        call.resolve();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }
}
