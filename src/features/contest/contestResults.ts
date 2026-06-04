import type { ContestData, ContestEntry } from './contestTypes';

/**
 * Represents one contest entry enriched with cumulative scoring details.
 */
export interface RankedContestEntry extends ContestEntry {
  displayPoints: number[];
  dqStatuses: boolean[];
  sortingPoints: number[];
}

/**
 * Represents contest data enriched with ranking metadata.
 */
export interface RankedContestData {
  entries: RankedContestEntry[];
  numEntries: number;
  numVoters: number;
  uniquePoints: number[];
  voterNames: string[];
}

/**
 * Returns true when the vote marks the entry as disqualified.
 */
function isDqVote(vote: string): boolean {
  return vote.trim().toLowerCase() === 'dq';
}

/**
 * Parses one vote cell into an integer score when it is numeric.
 */
export function parseVoteValue(vote: string): number | null {
  const trimmedVote = vote.trim();

  if (trimmedVote.length === 0) {
    return null;
  }

  const parsedVote = Number.parseFloat(trimmedVote);

  if (Number.isNaN(parsedVote)) {
    return null;
  }

  return Math.trunc(parsedVote);
}

/**
 * Computes cumulative display points for one entry across all voters.
 */
function calculateDisplayPoints(votes: string[]): number[] {
  let runningTotal = 0;

  return votes.map((vote) => {
    const parsedVote = parseVoteValue(vote);

    if (parsedVote !== null) {
      runningTotal += parsedVote;
    }

    return runningTotal;
  });
}

/**
 * Computes the cumulative DQ status for one entry across all voters.
 */
function calculateDqStatuses(votes: string[]): boolean[] {
  let isDisqualified = false;

  return votes.map((vote) => {
    if (isDqVote(vote)) {
      isDisqualified = true;
    }

    return isDisqualified;
  });
}

/**
 * Computes sorting points, replacing totals with -1000 after disqualification.
 */
function calculateSortingPoints(
  displayPoints: number[],
  dqStatuses: boolean[],
): number[] {
  return displayPoints.map((points, index) => {
    return dqStatuses[index] ? -1000 : points;
  });
}

/**
 * Builds one ranked contest entry from parsed spreadsheet data.
 */
function buildRankedEntry(entry: ContestEntry): RankedContestEntry {
  const displayPoints = calculateDisplayPoints(entry.votes);
  const dqStatuses = calculateDqStatuses(entry.votes);

  return {
    ...entry,
    displayPoints,
    dqStatuses,
    sortingPoints: calculateSortingPoints(displayPoints, dqStatuses),
  };
}

/**
 * Counts how many non-zero numeric votes an entry has received up to one voter.
 */
export function getVoterCountAfterVoter(
  entry: RankedContestEntry,
  voterIndex: number,
): number {
  let count = 0;

  for (let index = 0; index <= voterIndex; index += 1) {
    const parsedVote = parseVoteValue(entry.votes[index] ?? '');

    if (parsedVote !== null && parsedVote !== 0) {
      count += 1;
    }
  }

  return count;
}

/**
 * Counts how many times an entry received one exact score up to one voter.
 */
export function getPointsCountAfterVoter(
  entry: RankedContestEntry,
  points: number,
  voterIndex: number,
): number {
  let count = 0;

  for (let index = 0; index <= voterIndex; index += 1) {
    if (parseVoteValue(entry.votes[index] ?? '') === points) {
      count += 1;
    }
  }

  return count;
}

/**
 * Returns the set of unique numeric vote values used by one entry.
 */
function getUniquePoints(entry: ContestEntry): Set<number> {
  const uniquePoints = new Set<number>();

  for (const vote of entry.votes) {
    const parsedVote = parseVoteValue(vote);

    if (parsedVote !== null) {
      uniquePoints.add(parsedVote);
    }
  }

  return uniquePoints;
}

/**
 * Compares two text fields using deterministic ascending ordering.
 */
function compareTextAscending(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

/**
 * Builds the ranked contest model used by the renderer.
 */
export function buildRankedContest(contest: ContestData): RankedContestData {
  const entries = contest.entries.map(buildRankedEntry);
  const uniquePoints = [
    ...new Set(
      entries.flatMap((entry) => {
        return [...getUniquePoints(entry)];
      }),
    ),
  ].sort((left, right) => {
    return right - left;
  });

  return {
    entries,
    numEntries: contest.numEntries,
    numVoters: contest.numVoters,
    uniquePoints,
    voterNames: contest.voterNames,
  };
}

/**
 * Returns the sorted standings after one voter using Melbourne tie-break rules.
 */
export function getResultsAfterVoter(
  contest: RankedContestData,
  voterIndex: number,
): RankedContestEntry[] {
  if (voterIndex < 0 || voterIndex >= contest.numVoters) {
    throw new RangeError(`Voter index ${String(voterIndex)} is out of range.`);
  }

  return [...contest.entries].sort((left, right) => {
    const sortingPointsDifference =
      right.sortingPoints[voterIndex] - left.sortingPoints[voterIndex];

    if (sortingPointsDifference !== 0) {
      return sortingPointsDifference;
    }

    const displayPointsDifference =
      right.displayPoints[voterIndex] - left.displayPoints[voterIndex];

    if (displayPointsDifference !== 0) {
      return displayPointsDifference;
    }

    const voterCountDifference =
      getVoterCountAfterVoter(right, voterIndex) -
      getVoterCountAfterVoter(left, voterIndex);

    if (voterCountDifference !== 0) {
      return voterCountDifference;
    }

    for (const points of contest.uniquePoints) {
      const pointsDifference =
        getPointsCountAfterVoter(right, points, voterIndex) -
        getPointsCountAfterVoter(left, points, voterIndex);

      if (pointsDifference !== 0) {
        return pointsDifference;
      }
    }

    const countryDifference = compareTextAscending(left.country, right.country);

    if (countryDifference !== 0) {
      return countryDifference;
    }

    const artistDifference = compareTextAscending(left.artist, right.artist);

    if (artistDifference !== 0) {
      return artistDifference;
    }

    return compareTextAscending(left.song, right.song);
  });
}
