using System;
using System.Collections.Generic;

namespace Melbourne.Contest
{
    public class Entry
    {
        public string Country { get; }
        public string Flag { get; }
        public string Artist { get; }
        public string Song { get; }
        public List<string> Votes { get; }

        public Entry(string country, string flag, string artist, string song, List<string> votes)
        {
            Country = country;
            Flag = flag;
            Artist = artist;
            Song = song;
            Votes = votes;
        }

        public List<int> VoterCount
        {
            get
            {
                List<int> numVoters = new List<int>();
                int count = 0;
                foreach (string vote in Votes)
                {
                    if (Int32.TryParse(vote, out int points))
                    {
                        count++;
                        numVoters.Add(count);
                    }
                }
                return numVoters;
            }
        }

        public List<int> DisplayPoints
        {
            get
            {
                List<int> displayPoints = new List<int>();
                int total = 0;
                foreach (string vote in Votes)
                {
                    if (Int32.TryParse(vote, out int points))
                    {
                        total += points;
                        displayPoints.Add(total);
                    }
                }
                return displayPoints;
            }
        }

        public List<bool> DisqualificationStatus
        {
            get
            {
                List<bool> disqualificationStatus = new List<bool>();
                bool isDisqualified = false;
                foreach (string vote in Votes)
                {
                    if (vote.ToLower().Equals("dq") || isDisqualified)
                    {
                        isDisqualified = true;
                    }
                    disqualificationStatus.Add(isDisqualified);
                }
                return disqualificationStatus;
            }
        }

        public List<int> SortingPoints
        {
            get
            {
                List<int> sortingPoints = new List<int>();
                for (int index = 0; index < DisplayPoints.Count; index++)
                {
                    if (DisqualificationStatus[index])
                    {
                        sortingPoints.Add(-1000);
                    }
                    else
                    {
                        sortingPoints.Add(DisplayPoints[index]);
                    }
                }
                return sortingPoints;
            }
        }

        public int PointsCountAfterVoter(int points, int voter)
        {
            if (voter < 0 || voter >= Votes.Count)
            {
                throw new ArgumentOutOfRangeException(String.Format("Voter number %d was invalid", voter));
            }

            int count = 0;
            foreach (string vote in Votes.GetRange(0, (int) voter))
            {
                if (Int32.TryParse(vote, out int parsedPoints))
                {
                    if (points == parsedPoints)
                    {
                        count++;
                    }
                }
            }
            return count;
        }
    }
}
