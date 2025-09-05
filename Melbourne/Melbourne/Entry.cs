using System.Runtime.InteropServices.Swift;

namespace Melbourne;

public class Entry
{
    public string Country { get; }
    public string Flag { get; }
    public string Artist { get; }
    public string Song { get; }
    public List<string> Votes { get; }
    public List<int> DisplayPoints { get; }
    public List<int> SortingPoints { get; }
    public List<bool> DisqualificationStatuses { get; }

    public Entry(string country, string flag, string artist, string song, List<string> votes)
    {
        this.Country = country;
        this.Flag = flag;
        this.Artist = artist;
        this.Song = song;
        this.Votes = votes;

        this.DisplayPoints = this.InitializeDisplayPoints();
        this.DisqualificationStatuses = this.InitializeDisqualificationStatuses();
        this.SortingPoints = this.InitializeSortingPoints();
    }

    private List<int> InitializeDisplayPoints()
    {
        List<int> displayPoints = new List<int>();
        int total = 0;
        foreach (string vote in this.Votes)
        {
            if (Int32.TryParse(vote, out int points))
            {
                total += points;
            }

            displayPoints.Add(total);
        }

        return displayPoints;
    }

    private List<bool> InitializeDisqualificationStatuses()
    {
        List<bool> disqualificationStatuses = new List<bool>();
        bool isDisqualified = false;
        foreach (string vote in this.Votes)
        {
            if (vote.Equals("dq", StringComparison.CurrentCultureIgnoreCase))
            {
                isDisqualified = true;
            }

            disqualificationStatuses.Add(isDisqualified);
        }

        return disqualificationStatuses;
    }

    private List<int> InitializeSortingPoints()
    {
        List<int> sortingPoints = new List<int>();
        foreach (var (displayPoints, isDisqualified) in this.DisplayPoints.Zip(this.DisqualificationStatuses))
        {
            if (isDisqualified)
            {
                sortingPoints.Add(-1000);
            }
            else
            {
                sortingPoints.Add(displayPoints);
            }
        }

        return sortingPoints;
    }

    private void ValidateVoterNumber(int voterNumber)
    {
        if (voterNumber < 0 || voterNumber > this.Votes.Count)
        {
            throw new ArgumentOutOfRangeException(nameof(voterNumber));
        }
    }
}