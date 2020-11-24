package org.iune.melbourne.contest;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

public class Contest {
    List<Entry> entries;
    List<String> voters;
    int numEntries;
    int numVoters;

    Set<Integer> uniquePoints;

    public Contest(List<Entry> entries, List<String> voters) {
        this.entries = entries;
        this.voters = voters;
    }

    public Contest(File excelFile) throws IOException {
        try (FileInputStream inputStream = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(inputStream);
        ) {
            DataFormatter formatter = new DataFormatter();
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> iterator = sheet.iterator();

            // Validate number of rows
            if (sheet.getLastRowNum() < 1) {
                throw new IllegalArgumentException("Excel sheet does not have enough rows");
            }

            // Validate number of columns
            if (sheet.getRow(0).getLastCellNum() < 6) {
                throw new IllegalArgumentException("Excel sheet does not have enough columns");
            }

            // Get list of voters from header row
            Row headerRow = iterator.next();
            Iterator<Cell> headerCellIterator = headerRow.cellIterator();
            List<String> voters = new ArrayList<>();
            while (headerCellIterator.hasNext()) {
                Cell cell = headerCellIterator.next();
                voters.add(formatter.formatCellValue(cell));
            }
            this.voters = voters.subList(6, voters.size());

            // Get list of entries from remaining rows
            this.entries = new ArrayList<>();
            while (iterator.hasNext()) {
                Row row = iterator.next();
                Iterator<Cell> cellIterator = row.cellIterator();

                List<String> rowContents = new ArrayList<>();
                while (cellIterator.hasNext()) {
                    Cell cell = cellIterator.next();
                    rowContents.add(formatter.formatCellValue(cell));
                }

                // Some rows don't have cell values for the last column, so we need to add
                // "overhang" cells to make sure that all rows are equal in cell count
                var numExtraCells = row.getLastCellNum() - rowContents.size();
                for (int i = 0; i < numExtraCells; i++) {
                    rowContents.add("");
                }

                String country = rowContents.get(1);
                String flag = rowContents.get(2);
                String artist = rowContents.get(3);
                String song = rowContents.get(4);
                List<String> votes = rowContents.subList(6, rowContents.size());

                if (country.length() == 0 && artist.length() == 0 && song.length() == 0) {
                    break;
                }

                Entry entry = new Entry(country, flag, artist, song, votes);
                entries.add(entry);
            }

        }
    }

    private List<String> getVotersFromRow(Row row) {
        var voters = new ArrayList<String>();
        DataFormatter formatter = new DataFormatter();
        Iterator<Cell> cellIterator = row.cellIterator();
        while (cellIterator.hasNext()) {
            Cell cell = cellIterator.next();
            var voter = formatter.formatCellValue(cell);
        }
        return voters;
    }

    private void validateVoterNum(int voter) {
        if (voter < 0 || voter >= this.voters.size()) {
            throw new IllegalArgumentException(String.format("Voter number %d was invalid", voter));
        }
    }

    public List<Entry> resultsAfterVoter(int voter) {
        this.validateVoterNum(voter);
        Comparator<Entry> entryComparator = Comparator
                .comparing((Entry entry) -> entry.getSortingPoints(voter)).reversed()
                .thenComparingInt((Entry entry) -> entry.getDisplayPoints(voter)).reversed()
                .thenComparingInt((Entry entry) -> entry.voterCountAfterVoter(voter)).reversed()
                .thenComparing(new EntryPointsCountComparator(voter)).reversed()
                .thenComparing(Entry::getCountry)
                .thenComparing(Entry::getArtist)
                .thenComparing(Entry::getSong);

        this.entries.sort(entryComparator);
        return this.entries;
    }

    public List<Entry> getEntries() {
        return entries;
    }

    public List<String> getVoters() {
        return voters;
    }

    public int getNumEntries() {
        return numEntries;
    }

    public int getNumVoters() {
        return numVoters;
    }
}
