package org.iune.melbourne.contest;

import com.univocity.parsers.common.processor.RowListProcessor;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class Contest {
    private String name;
    private List<String> voters;
    private List<Entry> entries;

    public Contest(String name, File contestFile) throws IOException {
        RowListProcessor processor;
        try {
            processor = Loader.loadFile(contestFile);
        }
        catch (IOException e) {
            throw new IOException("Can't open file " + contestFile.getAbsolutePath());
        }

        this.voters = this.setVoters(processor);
        this.entries = this.setEntries(processor);
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
        for (int i = 0; i < rows.size(); i++) {
            String[] row = rows.get(i);

            String country = row[1];
            File flag = new File(row[2]);
            String artist = row[3];
            String song = row[4];

            List<String> votes = new ArrayList<>();
            for(int j = 6; j < row.length; j++) {
                if(row[j] == null) votes.add("");
                else votes.add(row[j]);
            }

            entries.add(new Entry(country, flag, artist, song, votes));
        }

        return entries;
    }
}
