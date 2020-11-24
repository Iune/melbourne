package org.iune.melbourne.contest;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;

class ContestTest {

    @Test
    void testLoadFromExcel() throws IOException {
        var excelPath = new File("src/test/resources", "215.xlsx");
        var contest = new Contest(excelPath);
        for (var entry : contest.getEntries()) {
            System.out.println(String.format("%3d | %s: %s - %s", entry.getDisplayPoints(entry.votes.size() - 1), entry.getCountry(), entry.getArtist(), entry.getSong()));
        }
    }
}