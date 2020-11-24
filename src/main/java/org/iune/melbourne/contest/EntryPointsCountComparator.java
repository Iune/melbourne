package org.iune.melbourne.contest;

import java.util.Comparator;
import java.util.TreeSet;

public class EntryPointsCountComparator implements Comparator<Entry> {

    int voter;

    public EntryPointsCountComparator(int voter) {
        this.voter = voter;
    }

    @Override
    public int compare(Entry first, Entry second) {
        var uniquePoints = new TreeSet<Integer>().descendingSet();
        uniquePoints.addAll(first.getUniquePoints());
        uniquePoints.addAll(second.getUniquePoints());

        for (var points : uniquePoints) {
            var score = first.pointsCountAfterVoter(points, this.voter).compareTo(second.pointsCountAfterVoter(points, this.voter));
            if (score != 0) {
                return score;
            }
        }

        return 0;
    }
}
