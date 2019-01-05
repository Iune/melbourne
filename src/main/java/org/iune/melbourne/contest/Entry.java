package org.iune.melbourne.contest;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class Entry {
    private String country;
    private File flag;
    private String artist;
    private String song;

    private List<String> votes;
    private List<Integer> displayPoints;
    private List<Integer> sortingPoints;
    private List<Boolean> disqualificationStatus;

    Entry(String country, String flag, String artist, String song, List<String> votes) {
        this.country = country;
        this.flag = new File(flag);
        this.artist = artist;
        this.song = song;

        this.votes = votes;
        this.setDisplayPoints();
        this.setSortingPoints();
    }

    public boolean validateFlag() {
        return this.flag.exists();
    }

    private void setDisplayPoints() {
        List<Integer> displayPoints = new ArrayList<>();

        int total = 0;
        for(String vote : this.votes) {
            int currentVote;
            try {
                currentVote = Integer.parseInt(vote);
            }
            catch (NumberFormatException e) {
                currentVote = 0;
            }

            total += currentVote;
            displayPoints.add(total);
        }

        this.displayPoints = displayPoints;
    }

    private void setSortingPoints() {
        List<Integer> sortingPoints = new ArrayList<>();
        List<Boolean> disqualificationStatus = new ArrayList<>();

        boolean isDisqualified = false;
        for (int i = 0; i < this.votes.size(); i++) {
            if (this.votes.get(i).equalsIgnoreCase("DQ")) isDisqualified = true;
            disqualificationStatus.add(isDisqualified);

            if (isDisqualified) sortingPoints.add(-1000);
            else sortingPoints.add(this.displayPoints.get(i));
        }
        this.sortingPoints = sortingPoints;
        this.disqualificationStatus = disqualificationStatus;
    }

    public String getCountry() {
        return this.country;
    }

    public File getFlag() {
        return this.flag;
    }

    public String getArtist() {
        return this.artist;
    }

    public String getSong() {
        return this.song;
    }

    public String getVotes(int voter) {
        return this.votes.get(voter);
    }

    public int getDisplayPoints(int voter) {
        return this.displayPoints.get(voter);
    }

    public int getsortingPoints(int voter) {
        return this.sortingPoints.get(voter);
    }

    public boolean getDisqualificationStatus(int voter) {
        return this.disqualificationStatus.get(voter);
    }
}
