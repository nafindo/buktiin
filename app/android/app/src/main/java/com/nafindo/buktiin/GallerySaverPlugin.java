package com.nafindo.buktiin;

import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "GallerySaver")
public class GallerySaverPlugin extends Plugin {
    private static final String TAG = "GallerySaver";

    @PluginMethod
    public void saveVideoToGallery(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename", "buktiin_" + System.currentTimeMillis() + ".mp4");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Data video base64 kosong");
            return;
        }

        if (!filename.toLowerCase().endsWith(".mp4")) {
            filename += ".mp4";
        }

        try {
            byte[] videoBytes = Base64.decode(base64Data, Base64.DEFAULT);
            boolean saved = writeVideoToMediaStore(getContext(), videoBytes, filename);
            if (saved) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Video berhasil disimpan ke Galeri HP!");
                call.resolve(ret);
            } else {
                call.reject("Gagal menyimpan video ke galeri perangkat");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving video to gallery: " + e.getMessage(), e);
            call.reject("Error saat menyimpan ke galeri: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadVideoFromUrl(PluginCall call) {
        String urlString = call.getString("url");
        String filename = call.getString("filename", "buktiin_" + System.currentTimeMillis() + ".mp4");

        if (urlString == null || urlString.isEmpty()) {
            call.reject("URL video kosong");
            return;
        }

        if (!filename.toLowerCase().endsWith(".mp4")) {
            filename += ".mp4";
        }

        final String finalFilename = filename;
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlString);
                conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 BuktiinApp/4.0");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.connect();

                int status = conn.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                    String redirectUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    conn = (HttpURLConnection) new URL(redirectUrl).openConnection();
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 BuktiinApp/4.0");
                    conn.connect();
                }

                try (InputStream in = conn.getInputStream()) {
                    boolean saved = writeStreamToMediaStore(getContext(), in, finalFilename);
                    if (saved) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("message", "Video berhasil diunduh dan disimpan ke Galeri HP!");
                        call.resolve(ret);
                    } else {
                        call.reject("Gagal menyimpan video unduhan ke galeri");
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Download video error: " + e.getMessage(), e);
                call.reject("Gagal mengunduh video: " + e.getMessage());
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }).start();
    }

    private boolean writeVideoToMediaStore(Context context, byte[] videoBytes, String filename) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Video.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
                values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Buktiin");
                values.put(MediaStore.Video.Media.IS_PENDING, 1);

                Uri collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri itemUri = context.getContentResolver().insert(collection, values);
                if (itemUri == null) return false;

                try (OutputStream out = context.getContentResolver().openOutputStream(itemUri)) {
                    out.write(videoBytes);
                    out.flush();
                }

                values.clear();
                values.put(MediaStore.Video.Media.IS_PENDING, 0);
                context.getContentResolver().update(itemUri, values, null, null);

                MediaScannerConnection.scanFile(context, new String[]{itemUri.toString()}, new String[]{"video/mp4"}, null);
                return true;
            } else {
                File moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES);
                File buktiinDir = new File(moviesDir, "Buktiin");
                if (!buktiinDir.exists()) buktiinDir.mkdirs();
                File targetFile = new File(buktiinDir, filename);

                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(videoBytes);
                    fos.flush();
                }

                MediaScannerConnection.scanFile(context, new String[]{targetFile.getAbsolutePath()}, new String[]{"video/mp4"}, null);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "writeVideoToMediaStore failed: " + e.getMessage(), e);
            return false;
        }
    }

    private boolean writeStreamToMediaStore(Context context, InputStream in, String filename) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Video.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
                values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Buktiin");
                values.put(MediaStore.Video.Media.IS_PENDING, 1);

                Uri collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri itemUri = context.getContentResolver().insert(collection, values);
                if (itemUri == null) return false;

                try (OutputStream out = context.getContentResolver().openOutputStream(itemUri)) {
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = in.read(buffer)) != -1) {
                        out.write(buffer, 0, len);
                    }
                    out.flush();
                }

                values.clear();
                values.put(MediaStore.Video.Media.IS_PENDING, 0);
                context.getContentResolver().update(itemUri, values, null, null);

                MediaScannerConnection.scanFile(context, new String[]{itemUri.toString()}, new String[]{"video/mp4"}, null);
                return true;
            } else {
                File moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES);
                File buktiinDir = new File(moviesDir, "Buktiin");
                if (!buktiinDir.exists()) buktiinDir.mkdirs();
                File targetFile = new File(buktiinDir, filename);

                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = in.read(buffer)) != -1) {
                        fos.write(buffer, 0, len);
                    }
                    fos.flush();
                }

                MediaScannerConnection.scanFile(context, new String[]{targetFile.getAbsolutePath()}, new String[]{"video/mp4"}, null);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "writeStreamToMediaStore failed: " + e.getMessage(), e);
            return false;
        }
    }
}
