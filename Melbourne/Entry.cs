namespace Melbourne;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

public class Entry
{
    public string Country { get; }
    public string Flag { get; }
    public string Artist { get; }
    public string Song { get; }

    public IReadOnlyList<string> Votes { get; }
    public IReadOnlyList<int> DisplayPoints { get; }
    public IReadOnlyList<bool> DqStatuses { get; }
    public IReadOnlyList<int> SortingPoints { get; }

    public Entry(
        string country,
        string flag,
        string artist,
        string song,
        IReadOnlyList<string> votes)
    {
        Country = country;
        Flag = flag;
        Artist = artist;
        Song = song;
        Votes = votes;

        DisplayPoints = CalculateDisplayPoints();
        DqStatuses = CalculateDqStatuses();
        SortingPoints = CalculateSortingPoints();
    }

    private IReadOnlyList<int> CalculateDisplayPoints()
    {
        var displayPoints = new List<int>(Votes.Count);
        var total = 0;

        foreach (var vote in Votes)
        {
            if (TryParseVote(vote, out var value))
            {
                total += value;
            }

            displayPoints.Add(total);
        }

        return displayPoints;
    }

    private IReadOnlyList<bool> CalculateDqStatuses()
    {
        var dqStatuses = new List<bool>(Votes.Count);
        var isDq = false;

        foreach (var vote in Votes)
        {
            if (IsDq(vote))
            {
                isDq = true;
            }

            dqStatuses.Add(isDq);
        }

        return dqStatuses;
    }

    private IReadOnlyList<int> CalculateSortingPoints()
    {
        return DisplayPoints
            .Zip(DqStatuses, (points, dq) => dq ? -1000 : points)
            .ToList();
    }

    private static bool IsDq(string vote)
    {
        return vote.Equals("dq", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseVote(string vote, out int value)
    {
        if (double.TryParse(
                vote,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var parsed))
        {
            value = (int)parsed;
            return true;
        }

        value = 0;
        return false;
    }

    private void ValidateVoterIndex(int voterIdx)
    {
        if (voterIdx < 0 || voterIdx >= Votes.Count)
        {
            throw new IndexOutOfRangeException(
                $"Voter number {voterIdx} was invalid");
        }
    }

    public int GetVoterCountAfterVoter(int voterIdx)
    {
        ValidateVoterIndex(voterIdx);

        var count = 0;
        for (var i = 0; i <= voterIdx; i++)
        {
            if (TryParseVote(Votes[i], out var value) && value != 0)
            {
                count++;
            }
        }

        return count;
    }

    public int GetPointsCountAfterVoter(int points, int voterIdx)
    {
        ValidateVoterIndex(voterIdx);

        var count = 0;
        for (var i = 0; i <= voterIdx; i++)
        {
            if (TryParseVote(Votes[i], out var value) && value == points)
            {
                count++;
            }
        }

        return count;
    }

    public ISet<int> GetUniquePoints()
    {
        var scores = new HashSet<int>();
        foreach (var vote in Votes)
        {
            if (TryParseVote(vote, out var value))
            {
                scores.Add(value);
            }
        }

        return scores;
    }
}
