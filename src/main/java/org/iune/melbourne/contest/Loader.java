package org.iune.melbourne.contest;

import com.univocity.parsers.common.processor.RowListProcessor;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import org.mozilla.universalchardet.ReaderFactory;
import org.mozilla.universalchardet.UniversalDetector;

import java.io.File;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

public class Loader {
    public static String detectFileEncoding(File filePath) throws IOException, IllegalArgumentException {
        try {
            String encoding = UniversalDetector.detectCharset(filePath);
            if (encoding != null) return encoding;
            else throw new IllegalArgumentException("Can't detect encoding of " + filePath.getAbsolutePath());
        } catch (IOException e) {
            throw new IOException("Can't open file " + filePath.getAbsolutePath());
        }
    }

    public static RowListProcessor loadFile(File filePath) throws IOException {
        String fileEncoding = detectFileEncoding(filePath);

        Reader reader = null;
        try {
            reader = ReaderFactory.createBufferedReader(filePath);

            CsvParserSettings parserSettings = new CsvParserSettings();
            parserSettings.setLineSeparatorDetectionEnabled(true);
            parserSettings.setDelimiterDetectionEnabled(true);
            parserSettings.setHeaderExtractionEnabled(true);

            RowListProcessor rowProcessor = new RowListProcessor();
            parserSettings.setProcessor(rowProcessor);

            CsvParser parser = new CsvParser(parserSettings);
            parser.parse(reader);
            return rowProcessor;
        }
        catch (IOException e) {
            throw new IOException("Can't open file " + filePath.getAbsolutePath());
        }
        finally {
            if (reader != null) reader.close();
        }

    }

    public static void parseFile(RowListProcessor rowProcessor) {
        String[] headers = rowProcessor.getHeaders();
        List<String[]> rows = rowProcessor.getRows();

        for (String elem : headers) System.out.println(elem);
    }

}
