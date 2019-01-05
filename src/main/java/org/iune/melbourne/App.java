package org.iune.melbourne;

import com.univocity.parsers.common.processor.RowListProcessor;
import org.mozilla.universalchardet.ReaderFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.Reader;

/**
 * Hello world!
 *
 */
public class App {
    public static void main (String[] args) throws java.io.IOException {
        if (args.length != 1) {
            System.err.println("Usage: java TestDetectorFile FILENAME");
            System.exit(1);
        }

       RowListProcessor processor = Loader.loadFile(new File(args[0]));
        Loader.parseFile(processor);

        /*String encoding = Loader.detectFileEncoding(new File(args[0]));
        System.out.println("Encoding is " + encoding);*/
    }
}
