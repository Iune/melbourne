package org.iune.melbourne.contest;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class EntryTest {

    Entry entry;

    @Before
    public void setUp() throws Exception {
        List<String> votes = new ArrayList<String>();
        votes.add("12");
        votes.add("");
        votes.add("4");
        votes.add("DQ");
        votes.add("1");

        entry = new Entry(
                "Iceland",
                new File("World/is.png"),
                "Ólafur Arnalds",
                "re:member",
                votes
        );
    }

    @Test
    public void validateFlag() {
        File mockedFlag = mock(File.class);
        when(mockedFlag.exists()).thenReturn(false);

        Entry newEntry = new Entry(
                "Iceland",
                mockedFlag,
                "Ólafur Arnalds",
                "re:member",
                new ArrayList<>()
        );
        assertFalse(newEntry.validateFlag());

        when(mockedFlag.exists()).thenReturn(true);
        newEntry = new Entry(
                "Iceland",
                mockedFlag,
                "Ólafur Arnalds",
                "re:member",
                new ArrayList<>()
        );
        assertTrue(newEntry.validateFlag());
    }

    @Test
    public void getCountry() {
        assertEquals("Iceland", entry.getCountry());
    }

    @Test
    public void getFlag() {
        assertEquals("is.png", entry.getFlag().getName());
    }

    @Test
    public void getArtist() {
        assertEquals("Ólafur Arnalds", entry.getArtist());
    }

    @Test
    public void getSong() {
        assertEquals("re:member", entry.getSong());
    }

    @Test
    public void getVotes() {
        assertEquals("12", entry.getVotes(0));
    }

    @Test
    public void getDisplayPoints() {
        assertEquals(12, entry.getDisplayPoints(0));
    }

    @Test
    public void getFinalDisplayPoints() {
        assertEquals(17, entry.getFinalDisplayPoints());
    }

    @Test
    public void getSortingPoints() {
        assertEquals(12, entry.getSortingPoints(0));
        assertEquals(-1000, entry.getSortingPoints(3));
    }

    @Test
    public void getFinalSortingPoints() {
        assertEquals(-1000, entry.getFinalSortingPoints());
    }

    @Test
    public void getDisqualificationStatus() {
        assertFalse(entry.getDisqualificationStatus(0));
    }

    @Test
    public void getFinalDisqualificationStatus() {
        assertTrue(entry.getFinalDisqualificationStatus());
    }

    @Test
    public void getNumVotersAfterVoter() {
        assertEquals(1, entry.getNumVotersAfterVoter(0));
        assertEquals(1, entry.getNumVotersAfterVoter(1));
        assertEquals(2, entry.getNumVotersAfterVoter(2));
        assertEquals(2, entry.getNumVotersAfterVoter(3));
        assertEquals(3, entry.getNumVotersAfterVoter(4));
    }

    @Test(expected=IndexOutOfBoundsException.class)
    public void getNumVotersAfterVoterThrowsException() {
        entry.getNumVotersAfterVoter(5);
    }

    @Test
    public void getFinalNumVoters() {
        assertEquals(3, entry.getFinalNumVoters());
    }
}