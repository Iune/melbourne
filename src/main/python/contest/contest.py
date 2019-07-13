import xlrd

from contest.entry import Entry


class Contest:
    def __init__(self, entries, voters):
        self.entries = entries
        self.voters = voters

        self.num_entries = len(self.entries)
        self.num_voters = len(self.voters)

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
            entries.append(Entry(
                country=str(row[1].value).strip(),
                flag=str(row[2].value).strip(),
                artist=str(row[3].value).strip(),
                song=str(row[4].value).strip(),
                votes=[str(cell.value).strip() for cell in row[6:]]
            ))

        return Contest(entries=entries, voters=voters)

    def final_results(self):
        return sorted(self.entries, key=lambda x: [
            -x.sorting_pts[-1],
            -x.display_pts[-1],
            -x.num_voters,
            -x.pts_count(12),
            -x.pts_count(10),
            -x.pts_count(8),
            -x.pts_count(7),
            -x.pts_count(6),
            -x.pts_count(5),
            -x.pts_count(4),
            -x.pts_count(3),
            -x.pts_count(2),
            -x.pts_count(1),
            x.country,
            x.artist,
            x.song
        ])

    def results_after_voter(self, voter):
        self._validate_voter_num(voter)
        return sorted(self.entries, key=lambda x: [
            -x.sorting_pts[voter],
            -x.display_pts[voter],
            -x.voter_count_after_voter(voter),
            -x.pts_count_after_voter(12, voter),
            -x.pts_count_after_voter(10, voter),
            -x.pts_count_after_voter(8, voter),
            -x.pts_count_after_voter(7, voter),
            -x.pts_count_after_voter(6, voter),
            -x.pts_count_after_voter(5, voter),
            -x.pts_count_after_voter(4, voter),
            -x.pts_count_after_voter(3, voter),
            -x.pts_count_after_voter(2, voter),
            -x.pts_count_after_voter(1, voter),
            x.country,
            x.artist,
            x.song
        ])
