import xlrd

from contest.entry import Entry


class Contest:
    def __init__(self, entries, voters):
        self.entries = entries
        self.voters = voters

        self.num_entries = len(self.entries)
        self.num_voters = len(self.voters)
        self._unique_points = list(sorted(self._find_unique_points(), reverse=True))

    def _validate_voter_num(self, voter):
        if voter < 0 or voter >= len(self.voters):
            raise IndexError("Voter number {} was invalid".format(voter))

    @staticmethod
    def from_file(file_path):
        excel = xlrd.open_workbook(file_path)
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

            # We want to stop reading once we see a blank row
            if not (country and artist and song):
                break

            entries.append(
                Entry(
                    country=country,
                    flag=flag,
                    artist=artist,
                    song=song,
                    votes=votes
                ))

        return Contest(entries=entries, voters=voters)

    def final_results(self):
        return sorted(self.entries, key=lambda x: [
            -x.sorting_pts[-1],
            -x.display_pts[-1],
            -x.num_voters,
        ] +
        [-x.pts_count(p) for p in self._unique_points] +
        [
            x.country,
            x.artist,
            x.song
        ])

    def results_after_voter(self, voter):
        self._validate_voter_num(voter)
        return sorted(self.entries, key=lambda x: [
            -x.sorting_pts[voter],
            -x.display_pts[voter],
            -x.voter_count_after_voter(voter)
        ] +
        [-x.pts_count_after_voter(p, voter) for p in self._unique_points] +
        [
            x.country,
            x.artist,
            x.song
        ])

    def _find_unique_points(self):
        votes = set()
        for entry in self.entries:
            entry_votes = entry.find_unique_points()
            votes.update(entry_votes)
        return votes
