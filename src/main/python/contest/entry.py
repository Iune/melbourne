class Entry:
    def __init__(self, country, flag, artist, song, votes):
        self.country = country
        self.flag = flag
        self.artist = artist
        self.song = song

        self.votes = votes
        self.display_pts = self._set_display_pts()
        self.sorting_pts = self._set_sorting_pts()
        self.dq_statuses = self._set_dq_statuses()
        self.num_voters = self.voter_count_after_voter(len(self.votes) - 1)

    def _set_display_pts(self):
        display_pts = []
        total = 0
        for vote in self.votes:
            try:
                total += int(float(vote))
            except ValueError:
                pass
            display_pts.append(total)
        return display_pts

    def _set_sorting_pts(self):
        sorting_pts = []
        is_dq = False
        for i, vote in enumerate(self.votes):
            if vote.lower() == "dq":
                is_dq = True
            if is_dq:
                sorting_pts.append(-1000)
            else:
                sorting_pts.append(self.display_pts[i])
        return sorting_pts

    def _set_dq_statuses(self):
        dq_statuses = []
        is_dq = False
        for vote in self.votes:
            if vote.lower() == "dq":
                is_dq = True
            dq_statuses.append(is_dq)
        return dq_statuses

    def _validate_voter_num(self, voter):
        if voter < 0 or voter >= len(self.votes):
            raise IndexError("Voter number {} was invalid".format(voter))

    def voter_count_after_voter(self, voter):
        self._validate_voter_num(voter)
        num_votes = 0
        for vote in self.votes[:voter + 1]:
            try:
                if int(float(vote)):
                    num_votes += 1
            except ValueError:
                continue
        return num_votes

    def pts_count_after_voter(self, points, voter):
        self._validate_voter_num(voter)
        count = 0
        for vote in self.votes[:voter + 1]:
            try:
                current_pts = int(float(vote))
                if current_pts == points:
                    count += 1
            except ValueError:
                continue
        return count

    def pts_count(self, points):
        return self.pts_count_after_voter(points, len(self.votes) - 1)

    def find_unique_points(self):
        scores = set()
        for vote in self.votes:
            try:
                score = int(float(vote))
                scores.add(score)
            except ValueError:
                continue
        return scores
