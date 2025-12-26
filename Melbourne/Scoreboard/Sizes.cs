namespace Melbourne;

using System;
using System.Linq;

public sealed class Sizes
{
    public Fonts Fonts { get; }
    public Config Config { get; }
    public int VoterIndex { get; }
    public float ScalingRatio { get; }

    public float Width { get; }
    public float Height { get; }
    public float Rectangle { get; }
    public float FlagOffset { get; }
    public float EntryDetailsWidth { get; }

    public Sizes(
        Fonts fonts,
        Config config,
        int voterIndex,
        float scalingRatio = Defaults.DefaultImageScalingRatio)
    {
        Fonts = fonts;
        Config = config;
        VoterIndex = voterIndex;
        ScalingRatio = scalingRatio;

        var voterHeaderText =
            $"Now Voting: {config.Contest.VoterNames[voterIndex]} " +
            $"({voterIndex + 1}/{config.Contest.NumVoters})";

        var (voterHeaderWidth, _) =
            Utilities.GetTextWidthHeight(
                fonts.VoterHeader, voterHeaderText);

        var contestHeaderText =
            config.AppendResultsToTitle
                ? $"{config.Title} Results"
                : config.Title;

        var (contestHeaderWidth, _) =
            Utilities.GetTextWidthHeight(
                fonts.ContestHeader, contestHeaderText);

        var maxCountryWidth = config.Contest.Entries
            .Max(e => Utilities
                .GetTextWidthHeight(fonts.Country, e.Country).Width);

        var maxEntryWidth = config.Contest.Entries
            .Max(e => Utilities.GetTextWidthHeight(
                fonts.EntryDetails,
                $"{e.Artist} – {e.Song}").Width);

        EntryDetailsWidth = maxEntryWidth;

        FlagOffset = config.DisplayFlags
            ? 24f * scalingRatio
            : 0f;

        Rectangle =
            Math.Max(maxCountryWidth, maxEntryWidth)
            + FlagOffset
            + 80f * scalingRatio;

        Width = (float)Math.Ceiling(
            Math.Max(
                Math.Max(
                    30f * scalingRatio + 2 * Rectangle,
                    48f * scalingRatio + contestHeaderWidth),
                10f * scalingRatio + voterHeaderWidth));

        var leftColumnCount =
            config.Contest.NumEntries / 2 +
            config.Contest.NumEntries % 2;

        Height = (float)Math.Ceiling(
            10f * scalingRatio
            + 35f * scalingRatio * leftColumnCount
            + 70f * scalingRatio);
    }
}
