import { describe, expect, it } from 'vitest';

import {
  buildRankedContest,
  getPointsCountAfterVoter,
  getResultsAfterVoter,
  getVoterCountAfterVoter,
  parseVoteValue,
} from './contestResults';
import type { ContestData } from './contestTypes';

const SAMPLE_CONTEST: ContestData = {
  entries: [
    {
      artist: 'Artist A',
      country: 'Alpha',
      flag: 'World/is.png',
      song: 'Song A',
      votes: ['12', '', 'dq'],
    },
    {
      artist: 'Artist B',
      country: 'Beta',
      flag: 'World/se.png',
      song: 'Song B',
      votes: ['10', '12', ''],
    },
    {
      artist: 'Artist C',
      country: 'Gamma',
      flag: 'World/no.png',
      song: 'Song C',
      votes: ['10', '10', ''],
    },
  ],
  hasCountColumn: false,
  numEntries: 3,
  numVoters: 3,
  voterNames: ['Voter A', 'Voter B', 'Voter C'],
};

describe('contestResults', () => {
  it('parses numeric votes while ignoring blank and non-numeric values', () => {
    expect(parseVoteValue('12')).toBe(12);
    expect(parseVoteValue('10.0')).toBe(10);
    expect(parseVoteValue('')).toBeNull();
    expect(parseVoteValue('dq')).toBeNull();
  });

  it('builds cumulative display points, dq states, and sorting points', () => {
    const rankedContest = buildRankedContest(SAMPLE_CONTEST);
    const alpha = rankedContest.entries[0];

    expect(alpha.displayPoints).toEqual([12, 12, 12]);
    expect(alpha.dqStatuses).toEqual([false, false, true]);
    expect(alpha.sortingPoints).toEqual([12, 12, -1000]);
  });

  it('counts voters and exact point values up to a voter index', () => {
    const rankedContest = buildRankedContest(SAMPLE_CONTEST);
    const gamma = rankedContest.entries[2];

    expect(getVoterCountAfterVoter(gamma, 1)).toBe(2);
    expect(getPointsCountAfterVoter(gamma, 10, 2)).toBe(2);
  });

  it('sorts results using the Melbourne tie-break rules', () => {
    const rankedContest = buildRankedContest(SAMPLE_CONTEST);

    expect(
      getResultsAfterVoter(rankedContest, 0).map((entry) => {
        return entry.country;
      }),
    ).toEqual(['Alpha', 'Beta', 'Gamma']);

    expect(
      getResultsAfterVoter(rankedContest, 1).map((entry) => {
        return entry.country;
      }),
    ).toEqual(['Beta', 'Gamma', 'Alpha']);

    expect(
      getResultsAfterVoter(rankedContest, 2).map((entry) => {
        return entry.country;
      }),
    ).toEqual(['Beta', 'Gamma', 'Alpha']);
  });
});
