namespace Melbourne;

public static class ContestSortingExtensions
{
    public static IOrderedEnumerable<Entry> ApplyUniquePointSorting(
        this IOrderedEnumerable<Entry> ordered,
        IReadOnlyList<int> uniquePoints,
        int voterIdx)
    {
        foreach (var points in uniquePoints)
        {
            ordered = ordered.ThenByDescending(
                e => e.GetPointsCountAfterVoter(points, voterIdx));
        }

        return ordered;
    }
}
