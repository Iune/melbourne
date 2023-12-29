from dataclasses import dataclass, field
from typing import List, Set


@dataclass
class Entry:
    country: str
    flag: str
    artist: str
    song: str
    votes: List[str]

    display_pts: List[int] = field(init=False)
    sorting_pts: List[int] = field(init=False)
    dq_statuses: List[bool] = field(init=False)
    num_voters: int = field(init=False)

    def __post_init__(self):
        self.display_pts = self._get_display_pts(self.votes)
        self.dq_statuses = self._get_dq_statuses(self.votes)
        self.sorting_pts = self._get_sorting_pts(self.dq_statuses, self.display_pts)
        self.num_voters = self.get_voter_count(len(self.votes) - 1)

    @staticmethod
    def _get_display_pts(votes: List[str]) -> List[int]:
        display_pts = []
        total = 0
        for vote in votes:
            try:
                total += int(float(vote))
            except ValueError:
                pass
            display_pts.append(total)
        return display_pts

    @staticmethod
    def _get_dq_statuses(votes: List[str]) -> List[bool]:
        dq_statuses = []
        is_dq = False
        for vote in votes:
            if vote.lower() == "dq":
                is_dq = True
            dq_statuses.append(is_dq)
        return dq_statuses

    @staticmethod
    def _get_sorting_pts(dq_statuses: List[bool], display_pts: List[int]) -> List[int]:
        return [
            -1000 if is_dq else points
            for is_dq, points in zip(dq_statuses, display_pts)
        ]

    def _validate_voter_num(self, voter: int) -> None:
        if voter < 0 or voter >= len(self.votes):
            raise IndexError("Voter number {} was invalid".format(voter))

    def get_voter_count(self, voter: int) -> int:
        self._validate_voter_num(voter)
        num_votes = 0
        for vote in self.votes[: voter + 1]:
            try:
                if int(float(vote)):
                    num_votes += 1
            except ValueError:
                continue
        return num_votes

    def get_pts_count(self, points: int, voter: int) -> int:
        self._validate_voter_num(voter)
        count = 0
        for vote in self.votes[: voter + 1]:
            try:
                current_pts = int(float(vote))
                if current_pts == points:
                    count += 1
            except ValueError:
                continue
        return count

    def get_unique_pts(self) -> Set[int]:
        scores = set()
        for vote in self.votes:
            try:
                score = int(float(vote))
                scores.add(score)
            except ValueError:
                continue
        return scores
