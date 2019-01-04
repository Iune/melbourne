package org.iune.melbourne;

import org.mozilla.universalchardet.UniversalDetector;

import java.io.File;
import java.io.IOException;

public class Loader {
    public static String detectEncoding(File filePath) throws IOException, IllegalArgumentException {
        try {
            String encoding = UniversalDetector.detectCharset(filePath);
            if (encoding != null) return encoding;
            else throw new IllegalArgumentException("Can't detect encoding of " + filePath.getAbsolutePath());
        } catch (IOException e) {
            throw new IOException("Can't open file " + filePath.getAbsolutePath());
        }
    }
}
