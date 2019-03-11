package org.iune.melbourne.cli;

import org.iune.melbourne.contest.Contest;
import org.iune.melbourne.contest.Entry;

import java.io.File;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class App {
    public static void main(String[] args) throws java.io.IOException {
        if (args.length != 2) {
            System.err.println("Usage: java Contest contestName filePath");
            System.exit(1);
        }

        Contest contest = new Contest(args[0], new File(args[1]));
        printResults(contest);
    }

    public static void printResults(Contest contest) {
        List<Entry> entries = contest.getEntries();
        int numVoters = contest.getVoters().size();
        entries.sort(Comparator.comparing(Entry::getFinalSortingPoints, Comparator.reverseOrder())
                .thenComparing(Entry::getFinalDisplayPoints, Comparator.reverseOrder())
                .thenComparing(Entry::getCountry)
                .thenComparing(Entry::getArtist)
        );

        System.out.println(contest.getName() + " Results:");
        System.out.println(String.join("", Collections.nCopies(contest.getName().length() + 9, "=")));

        for (int i = 0; i < entries.size(); i++) {
            Entry entry = entries.get(i);
            if (entry.getFinalDisqualificationStatus()) System.out.printf("%2d | %3d | %s: %s - %s (Disqualified)\n", i+1, entry.getFinalDisplayPoints(), entry.getCountry(), entry.getArtist(), entry.getSong());
            else System.out.printf("%2d | %3d | %s: %s - %s\n", i+1, entry.getFinalDisplayPoints(), entry.getCountry(), entry.getArtist(), entry.getSong());
        }
    }
}