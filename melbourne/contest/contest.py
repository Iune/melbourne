import logging
from dataclasses import dataclass, field
from pathlib import Path

import xlrd

logger = logging.getLogger(__name__)


@dataclass
class Entry:
    country: str
    flag: str
    artist: str
    song: str

    votes: list[str]
    display_pts: list[int] = field(init=False)
    dq_statuses: list[bool] = field(init=False)
    sorting_pts: list[int] = field(init=False)

    def __post_init__(self):
        self.display_pts = self._get_display_pts()
        self.dq_statuses = self._get_dq_status()
        self.sorting_pts = self._get_sorting_pts()

    def _get_display_pts(self) -> list[int]:
        """Get the points to be displayed on the scoreboard"""
        display_pts = []
        total = 0
        for vote in self.votes:
            try:
                total += int(float(vote))
            except ValueError:
                pass
            display_pts.append(total)
        return display_pts

    def _get_dq_status(self) -> list[bool]:
        """Get whether the entry has been disqualified"""
        dq_statuses = []
        is_dq = False
        for vote in self.votes:
            if vote.lower() == "dq":
                is_dq = True
            dq_statuses.append(is_dq)
        return dq_statuses

    def _get_sorting_pts(self) -> list[int]:
        """Get the points to be used to sort entries for display on the scoreboard"""
        sorting_pts = [
            -1000 if dq_status else display_pts
            for display_pts, dq_status in zip(self.display_pts, self.dq_statuses)
        ]
        return sorting_pts

    def _validate_voter_idx(self, voter_idx: int) -> None:
        if voter_idx < 0 or voter_idx >= len(self.votes):
            raise IndexError(f"Voter number {voter_idx} was invalid")

    def get_voter_count_after_voter(self, voter_idx: int) -> int:
        """Get the number of voters who voted for the entry, after voter_idx's votes were counted"""
        self._validate_voter_idx(voter_idx)
        num_votes = 0
        for vote in self.votes[: voter_idx + 1]:
            try:
                if int(float(vote)):
                    num_votes += 1
            except ValueError:
                continue
        return num_votes

    def get_pts_count_after_voter(self, points: int, voter_idx: int) -> int:
        """Get the number of times the entry received the specified number of points, after voter_idx's votes were counted"""
        self._validate_voter_idx(voter_idx)
        count = 0
        for vote in self.votes[: voter_idx + 1]:
            try:
                current_pts = int(float(vote))
                if current_pts == points:
                    count += 1
            except ValueError:
                continue
        return count

    def get_unique_points(self) -> set[int]:
        """Get the set of points that the entry received"""
        scores = set()
        for vote in self.votes:
            try:
                score = int(float(vote))
                scores.add(score)
            except ValueError:
                continue
        return scores


@dataclass
class Contest:
    entries: list[Entry]
    voter_names: list[str]

    num_entries: int = field(init=False)
    num_voters: int = field(init=False)

    _unique_pts: list[int] = field(init=False)

    def __post_init__(self) -> None:
        self.num_entries = len(self.entries)
        self.num_voters = len(self.voter_names)
        self._unique_pts = self._get_unique_points()

    def _get_unique_points(self) -> list[int]:
        unique_pts = set()
        for entry in self.entries:
            unique_pts.update(entry.get_unique_points())
        return list(sorted(unique_pts, reverse=True))

    def _validate_voter_idx(self, voter_idx: int) -> None:
        if voter_idx < 0 or voter_idx >= len(self.voter_names):
            raise IndexError(f"Voter number {voter_idx} was invalid")

    def get_results_after_voter(self, voter_idx: int) -> list[Entry]:
        """Get the contest results after voter_idx's votes were counted"""
        self._validate_voter_idx(voter_idx)
        return sorted(
            self.entries,
            key=lambda x: [
                # Sort first by the sorting points and display points (to handle ties among DQ'd entries)
                -x.sorting_pts[voter_idx],
                -x.display_pts[voter_idx],
                # Sort by the number of voters each entry currently has
                -x.get_voter_count_after_voter(voter_idx),
            ]
            # Sort by the number of times the entry got each set of unique (sorted) points
            + [-x.get_pts_count_after_voter(p, voter_idx) for p in self._unique_pts]
            # Sort by country, artist, and song in order to break any remaining ties
            + [x.country, x.artist, x.song],
        )

    def print_final_results(self) -> None:
        """Print formatted results"""
        results = self.get_results_after_voter(self.num_voters - 1)
        zfill_place_len = len(str(self.num_entries))
        zfill_pts_len = len(str(results[0].display_pts[-1]))
        for i, entry in enumerate(results):
            print(
                f"{str(i + 1).zfill(zfill_place_len)} | {str(entry.display_pts[-1]).zfill(zfill_pts_len)} | {entry.country}: {entry.artist} - {entry.song}"
            )


def get_contest_from_file(file_path: Path, has_count_column: bool):
    """Load contest from Excel file"""
    excel = xlrd.open_workbook(file_path)
    sheet = excel.sheet_by_index(0)

    if has_count_column:
        min_required_cols = 8
        starting_vote_col = 7
    else:
        min_required_cols = 7
        starting_vote_col = 6

    if sheet.ncols < min_required_cols:
        raise ValueError("Excel sheet does not have enough columns")
    if sheet.nrows < 2:
        raise ValueError("Excel sheet does not have enough rows")

    voter_names = [str(cell.value).strip() for cell in sheet.row(0)[6:]]

    entries = []
    for row in [row for row in sheet.get_rows()][1:]:
        country = str(row[1].value).strip()
        flag = str(row[2].value).strip()
        artist = str(row[3].value).strip()
        song = str(row[4].value).strip()
        votes = [str(cell.value).strip() for cell in row[starting_vote_col:]]

        # We want to stop reading once we see a row without these required fields
        if not (country and artist and song):
            break

        entry = Entry(country=country, flag=flag, artist=artist, song=song, votes=votes)
        logger.debug(f"Loaded {entry=}")
        entries.append(entry)

    return Contest(entries=entries, voter_names=voter_names)
