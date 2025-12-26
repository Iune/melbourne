namespace Melbourne.Contest;

public class Contest
{
    public IReadOnlyList<Entry> Entries { get; }
    public IReadOnlyList<string> VoterNames { get; }

    public int NumEntries { get; }
    public int NumVoters { get; }

    private IReadOnlyList<int> UniquePoints { get; }

    public Contest(
        IReadOnlyList<Entry> entries,
        IReadOnlyList<string> voterNames)
    {
        Entries = entries;
        VoterNames = voterNames;

        NumEntries = entries.Count;
        NumVoters = voterNames.Count;
        UniquePoints = CalculateUniquePoints();
    }

    private IReadOnlyList<int> CalculateUniquePoints()
    {
        return Entries
            .SelectMany(e => e.GetUniquePoints())
            .Distinct()
            .OrderByDescending(p => p)
            .ToList();
    }

    private void ValidateVoterIndex(int voterIdx)
    {
        if (voterIdx < 0 || voterIdx >= VoterNames.Count)
        {
            throw new IndexOutOfRangeException(
                $"Voter number {voterIdx} was invalid");
        }
    }

    public IReadOnlyList<Entry> ResultsAfterVoter(int voterIdx)
    {
        ValidateVoterIndex(voterIdx);

        return Entries
            .OrderBy(e => 0) // anchor to allow ThenBy chains
            // Sorting points (DQ handling)
            .ThenByDescending(e => e.SortingPoints[voterIdx])
            // Display points (tie-breaking among DQ'd entries)
            .ThenByDescending(e => e.DisplayPoints[voterIdx])
            // Number of voters so far
            .ThenByDescending(e => e.GetVoterCountAfterVoter(voterIdx))
            // Count of each unique point value (descending)
            .ApplyUniquePointSorting(UniquePoints, voterIdx)
            // Final deterministic tie-breakers
            .ThenBy(e => e.Country)
            .ThenBy(e => e.Artist)
            .ThenBy(e => e.Song)
            .ToList();
    }

    public void PrintFinalResults()
    {
        var results = ResultsAfterVoter(NumVoters - 1);
        var placeWidth = NumEntries.ToString().Length;
        var pointsWidth = results[0].DisplayPoints.Last().ToString().Length;

        for (var i = 0; i < results.Count; i++)
        {
            var entry = results[i];

            Console.WriteLine(
                $"{(i + 1).ToString().PadLeft(placeWidth, '0')} | " +
                $"{entry.DisplayPoints.Last().ToString().PadLeft(pointsWidth, '0')} | " +
                $"{entry.Country}: {entry.Artist} - {entry.Song}");
        }
    }
}