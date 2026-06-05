import type { ContestData, ContestEntry } from './contestTypes';

/**
 * Represents one parsed contest entry enriched with cumulative scoring metadata.
 */
export interface RankedContestEntry extends ContestEntry {
  displayPoints: number[];
  dqStatuses: boolean[];
  sortingPoints: number[];
}

/**
 * Represents contest data enriched with the metadata needed for per-voter ranking and rendering.
 */
export interface RankedContestData {
  entries: RankedContestEntry[];
  numEntries: number;
  numVoters: number;
  uniquePoints: number[];
  voterNames: string[];
}

/**
 * Checks whether a raw vote cell marks the entry as disqualified.
 *
 * @param vote The raw vote cell text from the workbook.
 * @returns `true` when the vote text represents a disqualification marker.
 */
function isDqVote(vote: string): boolean {
  return vote.trim().toLowerCase() === 'dq';
}

/**
 * Parses a raw vote cell into an integer score when the value is numeric.
 *
 * @param vote The raw vote cell text from the workbook.
 * @returns The truncated numeric vote value, or `null` when the cell is blank or non-numeric.
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
 * Computes the cumulative display-point total for one entry after each voter reveal.
 *
 * @param votes The raw vote values for a single entry, in voter order.
 * @returns An array whose `n`th element is the running score shown after voter `n`.
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
 * Computes whether an entry should be treated as disqualified after each voter reveal.
 *
 * @param votes The raw vote values for a single entry, in voter order.
 * @returns An array whose `n`th element indicates whether the entry is disqualified after voter
 * `n`.
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
 * Computes the score values used for sorting standings after each voter reveal.
 *
 * @param displayPoints The cumulative visible point totals for one entry after each voter.
 * @param dqStatuses The cumulative disqualification status for the same entry after each voter.
 * @returns A per-voter score array suitable for ranking, where disqualified states are forced to a
 * low sentinel value so they sort below non-disqualified entries.
 */
function calculateSortingPoints(displayPoints: number[], dqStatuses: boolean[]): number[] {
  return displayPoints.map((points, index) => {
    return dqStatuses[index] ? -1000 : points;
  });
}

/**
 * Enriches one parsed contest entry with cumulative scoring metadata.
 *
 * @param entry The parsed contest entry row from the workbook.
 * @returns A `RankedContestEntry` containing running totals, disqualification state, and sorting
 * scores.
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
 * Counts how many non-zero numeric votes an entry has received up to a given voter reveal.
 *
 * @param entry The ranked contest entry whose vote history should be examined.
 * @param voterIndex The zero-based voter index up to which votes should be counted.
 * @returns The number of non-zero numeric votes received through the specified voter.
 */
export function getVoterCountAfterVoter(entry: RankedContestEntry, voterIndex: number): number {
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
 * Counts how many times an entry received one exact numeric score up to a given voter reveal.
 *
 * @param entry The ranked contest entry whose vote history should be examined.
 * @param points The exact numeric score to count.
 * @param voterIndex The zero-based voter index up to which votes should be counted.
 * @returns The number of occurrences of the requested score through the specified voter.
 */
export function getPointsCountAfterVoter(entry: RankedContestEntry, points: number, voterIndex: number): number {
  let count = 0;

  for (let index = 0; index <= voterIndex; index += 1) {
    if (parseVoteValue(entry.votes[index] ?? '') === points) {
      count += 1;
    }
  }

  return count;
}

/**
 * Collects the unique numeric vote values used by one entry.
 *
 * @param entry The parsed contest entry whose vote values should be examined.
 * @returns A set of distinct numeric vote values used by the entry, excluding blanks and
 * non-numeric values.
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
 * Compares two strings using deterministic ascending ordering.
 *
 * @param left The left-hand string being compared.
 * @param right The right-hand string being compared.
 * @returns A negative number, zero, or a positive number according to standard ascending order.
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
 * Builds the ranked contest model used by rendering and export code.
 *
 * @param contest The parsed contest workbook data before cumulative ranking metadata is added.
 * @returns A `RankedContestData` object containing enriched entries and the unique point values
 * needed for tie-break sorting.
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
 * Returns the sorted standings after a specific voter reveal.
 *
 * @param contest The ranked contest data containing cumulative scoring metadata and tie-break
 * inputs.
 * @param voterIndex The zero-based voter index whose post-vote standings should be produced.
 * @returns A newly sorted array of ranked entries in standing order after the specified voter.
 */
export function getResultsAfterVoter(contest: RankedContestData, voterIndex: number): RankedContestEntry[] {
  if (voterIndex < 0 || voterIndex >= contest.numVoters) {
    throw new RangeError(`Voter index ${String(voterIndex)} is out of range.`);
  }

  return [...contest.entries].sort((left, right) => {
    const sortingPointsDifference = right.sortingPoints[voterIndex] - left.sortingPoints[voterIndex];

    if (sortingPointsDifference !== 0) {
      return sortingPointsDifference;
    }

    const displayPointsDifference = right.displayPoints[voterIndex] - left.displayPoints[voterIndex];

    if (displayPointsDifference !== 0) {
      return displayPointsDifference;
    }

    const voterCountDifference = getVoterCountAfterVoter(right, voterIndex) - getVoterCountAfterVoter(left, voterIndex);

    if (voterCountDifference !== 0) {
      return voterCountDifference;
    }

    for (const points of contest.uniquePoints) {
      const pointsDifference =
        getPointsCountAfterVoter(right, points, voterIndex) - getPointsCountAfterVoter(left, points, voterIndex);

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
