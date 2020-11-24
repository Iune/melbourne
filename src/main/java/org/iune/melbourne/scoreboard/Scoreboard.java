package org.iune.melbourne.scoreboard;

import org.iune.melbourne.contest.Contest;

import java.nio.file.Path;

public interface Scoreboard<Options> {
    void generateScoreboard(Contest contest, Path scoreboardPath, Options options);
}
