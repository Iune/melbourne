package org.iune.melbourne;

import org.iune.melbourne.contest.Contest;

import java.io.File;

public class App {
    public static void main (String[] args) throws java.io.IOException {
        if (args.length != 2) {
            System.err.println("Usage: java Contest NAME FILENAME");
            System.exit(1);
        }

       Contest contest = new Contest(args[0], new File(args[1]));
    }
}
