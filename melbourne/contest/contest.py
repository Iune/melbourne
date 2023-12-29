from dataclasses import dataclass, field
from typing import List, Union

import xlrd

from melbourne.contest.entry import Entry


@dataclass
class Contest:
    entries: List[Entry]
    voters: List[str]

    num_entries: int = field(init=False)
    num_voters: int = field(init=False)
    _unique_pts: List[int] = field(init=False)

    def __post_init__(self):
        self.num_entries = len(self.entries)
        self.num_voters = len(self.voters)
        self._unique_pts = self._get_unique_pts()

    def _get_unique_pts(self) -> List[int]:
        votes = set()
        for entry in self.entries:
            entry_votes = entry.get_unique_pts()
            votes.update(entry_votes)
        return list(sorted(votes, reverse=True))

    def _validate_voter_num(self, voter: int) -> None:
        if voter < 0 or voter >= len(self.voters):
            raise IndexError("Voter number {} was invalid".format(voter))

    def results_after_voter(self, voter) -> List[Entry]:
        self._validate_voter_num(voter)
        return sorted(
            self.entries,
            key=lambda x: [
                -x.sorting_pts[voter],
                -x.display_pts[voter],
                -x.get_voter_count(voter),
            ]
            + [-x.get_pts_count(p, voter) for p in self._unique_pts]
            + [x.country, x.artist, x.song],
        )


def load_contest_from_file(file: Union[str, bytes]) -> Contest:
    kw_name = "file_contents" if isinstance(file, bytes) else "filename"
    excel = xlrd.open_workbook(**{kw_name: file})
    sheet = excel.sheet_by_index(0)
    if sheet.ncols < 7:
        raise ValueError("Excel sheet does not have enough columns")
    if sheet.nrows < 2:
        raise ValueError("Excel sheet does not have enough rows")

    voters = [str(cell.value).strip() for cell in sheet.row(0)[6:]]

    entries = []
    for row in [row for row in sheet.get_rows()][1:]:
        country = str(row[1].value).strip()
        flag = str(row[2].value).strip()
        artist = str(row[3].value).strip()
        song = str(row[4].value).strip()
        votes = [str(cell.value).strip() for cell in row[6:]]

        # We want to stop reading once we see a row without these required fields
        if not (country and artist and song):
            break

        entries.append(
            Entry(country=country, flag=flag, artist=artist, song=song, votes=votes)
        )

    return Contest(entries=entries, voters=voters)
