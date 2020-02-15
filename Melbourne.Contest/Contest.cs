using System;
using System.Collections.Generic;
using System.Linq;

namespace Melbourne.Contest
{
    public class Contest
    {
        public List<Entry> Entries { get; }
        public List<string> Voters { get; }

        public Contest(List<Entry> entries, List<string> voters)
        {
            Entries = entries;
            Voters = voters;
        }

        public Contest()
        {
            // TODO: Add constructor to load from Excel file
        }

        public int NumEntries
        {
            get => Entries.Count;
        }

        public int NumVoters
        {
            get => Voters.Count;
        }

        public List<Entry> ResultsAfterVoter(int voter)
        {
            if (voter < 0 || voter >= Voters.Count)
            {
                throw new ArgumentOutOfRangeException(String.Format("Voter number %d was invalid", voter));
            }

            return Entries
                .OrderByDescending(e => e.SortingPoints[voter])
                .ThenByDescending(e => e.DisplayPoints[voter])
                .ThenByDescending(e => e.VoterCount[voter])
                .ThenByDescending(e => e.PointsCountAfterVoter(12, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(10, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(8, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(7, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(6, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(5, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(4, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(3, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(2, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(1, voter))
                .ThenBy(e => e.Country)
                .ThenBy(e => e.Artist)
                .ThenBy(e => e.Song)
                .ToList();
        }

        public List<Entry> FinalResults
        {
            get
            {
                if(Voters.Count > 0)
                {
                    return ResultsAfterVoter(Voters.Count - 1);
                }
                else
                {
                    return Entries;
                }
            }
        }
    }
}
