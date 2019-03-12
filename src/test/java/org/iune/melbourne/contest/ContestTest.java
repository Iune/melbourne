package org.iune.melbourne.contest;

import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ContestTest {

    Contest unicodeContest;
    Contest windows1252Contest;

    @Before
    public void setUp() throws Exception {
        File unicodeContestFile = new File("src/test/resources/189-UTF-8.csv");
        unicodeContest = new Contest("FSC 189", unicodeContestFile);

        File windows1252ContestFile = new File("src/test/resources/189-1252.csv");
        windows1252Contest = new Contest("FSC 189", windows1252ContestFile);

    }

    @Test
    public void loadWindows1252File() throws IOException {
        assertEquals("Ólafur Arnalds", windows1252Contest.getEntries().get(0).getArtist());

        // Windows-1252 format does not support 'ć' character, should be replaced with ?
        assertEquals("Jelena Tomaševi?", windows1252Contest.getEntries().get(9).getArtist());
    }

    @Test
    public void loadUTF8File() throws IOException {
        assertEquals("Ólafur Arnalds", unicodeContest.getEntries().get(0).getArtist());
        assertEquals("Jelena Tomašević", unicodeContest.getEntries().get(9).getArtist());
    }

    @Test(expected = IOException.class)
    public void loadNonExistentFile() throws IOException {
        File contestFile = new File("src/test/resources/non-existent.csv");
        new Contest("FSC 189", contestFile);
    }

    @Test
    public void getName() {
        assertEquals("FSC 189", unicodeContest.getName());
    }

    @Test
    public void getVoters() {
        assertEquals("Albania", unicodeContest.getVoters().get(0));
    }

    @Test
    public void getNumVoters() {
        assertEquals(41, unicodeContest.getNumVoters());
    }

    @Test
    public void getEntries() {
        assertEquals("Iceland", unicodeContest.getEntries().get(0).getCountry());
    }
}