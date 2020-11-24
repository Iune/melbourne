package org.iune.melbourne.contest;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Entry {
    String country;
    String flag;
    String artist;
    String song;

    List<String> votes;
    List<Integer> displayPoints;
    List<Integer> sortingPoints;
    List<Boolean> dqStatuses;
    List<Integer> numVoters;
    Set<Integer> uniquePoints;

    public Entry(String country, String flag, String artist, String song, List<String> votes) {
        this.country = country;
        this.flag = flag;
        this.artist = artist;
        this.song = song;
        this.votes = votes;

        this.displayPoints = this.setDisplayPoints();
        this.sortingPoints = this.setSortingPoints();
        this.dqStatuses = this.setDQStatuses();
        this.uniquePoints = this.setUniquePoints();
    }

    private List<Integer> setDisplayPoints() {
        var displayPoints = new ArrayList<Integer>();
        var total = 0;
        for (var vote : this.votes) {
            try {
                total += Integer.parseInt(vote);
            } catch (NumberFormatException ignored) {
            }
            displayPoints.add(total);
        }
        return displayPoints;
    }

    private List<Integer> setSortingPoints() {
        var sortingPoints = new ArrayList<Integer>();
        var dqStatus = false;
        for (var i = 0; i < this.votes.size(); i++) {
            String vote = this.votes.get(i);
            if (!dqStatus && vote.equalsIgnoreCase("dq")) {
                dqStatus = true;
            }
            if (dqStatus) {
                sortingPoints.add(-1000);
            } else {
                sortingPoints.add(this.displayPoints.get(i));
            }
        }
        return sortingPoints;
    }

    private List<Boolean> setDQStatuses() {
        var dqStatuses = new ArrayList<Boolean>();
        var dqStatus = false;
        for (String vote : this.votes) {
            if (!dqStatus && vote.equalsIgnoreCase("dq")) {
                dqStatus = true;
            }
            dqStatuses.add(dqStatus);
        }
        return dqStatuses;
    }

    // Because of issues with the final column number in Excel, the voters array may be off by 1
    private int getValidVoterNumber(int voter) {
        if (voter < 0) {
            throw new IllegalArgumentException(String.format("Voter number %d was invalid", voter));
        } else if (voter >= this.votes.size()) {
            return this.votes.size() - 1;
        } else {
            return voter;
        }
    }

    public Integer voterCountAfterVoter(int voter) {
        this.getValidVoterNumber(voter);
        var numVotes = 0;
        for (var vote : this.votes.subList(0, voter + 1)) {
            try {
                Integer.parseInt(vote);
                numVotes++;
            } catch (NumberFormatException ignored) {
            }
        }
        return numVotes;
    }

    public Integer pointsCountAfterVoter(int points, int voter) {
        this.getValidVoterNumber(voter);
        var count = 0;
        for (var vote : this.votes.subList(0, voter + 1)) {
            try {
                int currentPoints = Integer.parseInt(vote);
                if (currentPoints == points) {
                    count++;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return count;
    }

    private Set<Integer> setUniquePoints() {
        var uniquePoints = new HashSet<Integer>();
        for (var vote : this.votes) {
            try {
                int points = Integer.parseInt(vote);
                uniquePoints.add(points);
            } catch (NumberFormatException ignored) {
            }
        }
        return uniquePoints;
    }

    public String getCountry() {
        return country;
    }

    public String getFlag() {
        return flag;
    }

    public String getArtist() {
        return artist;
    }

    public String getSong() {
        return song;
    }

    public List<String> getVotes() {
        return votes;
    }

    public Integer getDisplayPoints(int voter) {
        this.getValidVoterNumber(voter);
        return displayPoints.get(voter);
    }

    public Integer getSortingPoints(int voter) {
        this.getValidVoterNumber(voter);
        return sortingPoints.get(voter);
    }

    public Boolean getDqStatuses(int voter) {
        this.getValidVoterNumber(voter);
        return dqStatuses.get(voter);
    }

    public Integer getNumVoters(int voter) {
        this.getValidVoterNumber(voter);
        return numVoters.get(voter);
    }

    public Set<Integer> getUniquePoints() {
        return uniquePoints;
    }
}
