package org.iune.melbourne.contest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class EntryPointsCountComparatorTest {

    List<Entry> entries;

    @BeforeEach
    void setUp() {
        entries = new ArrayList<>();
        // 3x 12, 1x 8, 1x 7, 2x 6
        entries.add(new Entry("Estonia", "World/ee.png", "Ines", "Once in a Lifetime",
                new ArrayList<>(Arrays.asList("12", "12", "12", "8", "7", "6", "6"))));
        // 3x 12, 3x 10, 1x 8
        entries.add(new Entry("Russia", "World/ru.png", "Alsou", "Solo",
                new ArrayList<>(Arrays.asList("8", "10", "10", "10", "12", "12", "12"))));
    }

    @Test
    void testPointsCountSorting() {
        // For the second-to-last-voter, Estonia has more 12 points and should be sorted ahead
        entries.sort(Collections.reverseOrder(new EntryPointsCountComparator(5)));
        assertEquals(entries.get(0).country, "Estonia");

        // At the end, Russia has the same number of 12 points, but more 10 points, and should be sorted ahead
        entries.sort(Collections.reverseOrder(new EntryPointsCountComparator(6)));
        assertEquals(entries.get(0).country, "Russia");
    }
}