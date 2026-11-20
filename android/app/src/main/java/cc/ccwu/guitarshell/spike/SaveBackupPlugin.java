package cc.ccwu.guitarshell.spike;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * 把本地备份真正写进系统下载目录。
 *
 * Android WebView 不会处理 <a download> + blob，网页端「备份成功」在壳里没有文件。
 * API 29+ 走 MediaStore，文件出现在「文件管理 → 下载 → GuitarShell」；
 * API 22–28 需要 WRITE_EXTERNAL_STORAGE，直接写公共 Download 目录。
 */
@CapacitorPlugin(
    name = "SaveBackup",
    permissions = {
        @Permission(
            alias = "storage",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class SaveBackupPlugin extends Plugin {

    private static final String MIME_JSON = "application/json";
    private static final String FOLDER = "GuitarShell";

    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("fileName");
        String data = call.getString("data");
        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("备份文件名不能为空");
            return;
        }
        if (data == null) {
            call.reject("备份内容不能为空");
            return;
        }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && !hasLegacyStoragePermission()) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }

        writeBackup(call, fileName, data);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (!hasLegacyStoragePermission()) {
            call.reject("没有存储权限，无法写入 Download 目录");
            return;
        }
        writeBackup(call, call.getString("fileName"), call.getString("data"));
    }

    private boolean hasLegacyStoragePermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        Context context = getContext();
        return context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            == PackageManager.PERMISSION_GRANTED;
    }

    private void writeBackup(PluginCall call, String fileName, String data) {
        try {
            JSObject result;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                result = writeWithMediaStore(fileName, data);
            } else {
                result = writeToPublicDownloads(fileName, data);
            }
            call.resolve(result);
        } catch (Exception err) {
            call.reject("备份写入失败：" + err.getMessage(), err);
        }
    }

    private JSObject writeWithMediaStore(String fileName, String data) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, MIME_JSON);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + FOLDER);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IOException("系统下载目录拒绝写入");

        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IOException("无法打开备份文件输出流");
            out.write(data.getBytes(StandardCharsets.UTF_8));
            out.flush();
        }

        ContentValues done = new ContentValues();
        done.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, done, null, null);

        String savedName = queryDisplayName(resolver, uri, fileName);
        JSObject result = new JSObject();
        result.put("fileName", savedName);
        result.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + FOLDER + "/" + savedName);
        result.put("uri", uri.toString());
        return result;
    }

    private JSObject writeToPublicDownloads(String fileName, String data) throws Exception {
        File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), FOLDER);
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("无法创建 Download/GuitarShell 目录");

        File file = uniqueFile(dir, fileName);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(data.getBytes(StandardCharsets.UTF_8));
            out.flush();
        }

        MediaScannerConnection.scanFile(
            getContext(),
            new String[] { file.getAbsolutePath() },
            new String[] { MIME_JSON },
            null
        );

        JSObject result = new JSObject();
        result.put("fileName", file.getName());
        result.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + FOLDER + "/" + file.getName());
        result.put("uri", Uri.fromFile(file).toString());
        return result;
    }

    private File uniqueFile(File dir, String fileName) {
        File candidate = new File(dir, fileName);
        if (!candidate.exists()) return candidate;

        String base = fileName;
        String ext = "";
        int dot = fileName.lastIndexOf('.');
        if (dot > 0) {
            base = fileName.substring(0, dot);
            ext = fileName.substring(dot);
        }
        for (int i = 1; i < 1000; i++) {
            File next = new File(dir, base + " (" + i + ")" + ext);
            if (!next.exists()) return next;
        }
        return new File(dir, base + "-" + System.currentTimeMillis() + ext);
    }

    private String queryDisplayName(ContentResolver resolver, Uri uri, String fallback) {
        try (android.database.Cursor cursor = resolver.query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null && !name.isEmpty()) return name;
            }
        } catch (Exception ignored) {}
        return fallback;
    }
}
