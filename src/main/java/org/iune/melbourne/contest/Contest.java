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

public class Contest {
    private final String name;
    private List<String> voters;
    private List<Entry> entries;

    public Contest(String name, File contestFile) throws IOException {
        RowListProcessor processor;
        try {
            processor = loadFile(contestFile);
        }
        catch (IOException e) {
            throw new IOException("Can't open file " + contestFile.getAbsolutePath());
        }

        this.name = name;
        this.voters = setVoters(processor);
        this.entries = setEntries(processor);
    }

    private static List<String> setVoters(RowListProcessor processor) {
        List<String> voters = new ArrayList<>();

        String[] headers = processor.getHeaders();
        for (int i = 6; i < headers.length; i++) {
            voters.add(headers[i]);
        }

        return voters;
    }

    private static List<Entry> setEntries(RowListProcessor processor) {
        List<Entry> entries = new ArrayList<>();

        List<String[]> rows = processor.getRows();
        for (String[] row : processor.getRows()) {
            String country = row[1];
            File flag = new File(row[2]);
            String artist = row[3];
            String song = row[4];

            List<String> votes = new ArrayList<>();
            for(int i = 6; i < row.length; i++) {
                if(row[i] == null) votes.add("");
                else votes.add(row[i]);
            }

            entries.add(new Entry(country, flag, artist, song, votes));
        }

        return entries;
    }

    private static String detectFileEncoding(File filePath) throws IOException, IllegalArgumentException {
        try {
            String encoding = UniversalDetector.detectCharset(filePath);
            if (encoding != null) return encoding;
            else throw new IllegalArgumentException("Can't detect encoding of " + filePath.getAbsolutePath());
        } catch (IOException e) {
            throw new IOException("Can't open file " + filePath.getAbsolutePath());
        }
    }

    private static RowListProcessor loadFile(File filePath) throws IOException {
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

    private static void parseFile(RowListProcessor rowProcessor) {
        String[] headers = rowProcessor.getHeaders();
        List<String[]> rows = rowProcessor.getRows();

        for (String elem : headers) System.out.println(elem);
    }

    public String getName() {
        return this.name;
    }

    public List<String> getVoters() {
        return this.voters;
    }

    public int getNumVoters() { return this.voters.size(); }

    public List<Entry> getEntries() {
        return this.entries;
    }
}
