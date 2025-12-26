namespace Melbourne;

using SkiaSharp;

public sealed class ScoreboardColors
{
    public SKColor Background { get; }
    public SKColor VoterHeader { get; }
    public SKColor VoterHeaderText { get; }
    public SKColor ContestHeader { get; }
    public SKColor ContestHeaderText { get; }

    public SKColor Flag { get; }
    public SKColor FlagBorder { get; }

    public SKColor EntryDetails { get; }
    public SKColor EntryDetailsBorder { get; }
    public SKColor EntryDetailsText { get; }
    public SKColor CountryText { get; }

    public SKColor TotalPoints { get; }
    public SKColor TotalPointsText { get; }
    public SKColor ReceivedPoints { get; }
    public SKColor ReceivedPointsText { get; }
    public SKColor DqedPoints { get; }
    public SKColor DqedPointsText { get; }

    public SKColor DividerLine { get; }

    public ScoreboardColors(
        string mainColorHex,
        string accentColorHex)
    {
        var main = ScoreboardUtilities.HexToRgb(mainColorHex);
        var accent = ScoreboardUtilities.HexToRgb(accentColorHex);

        static SKColor ChooseTextColor(SKColor bg)
        {
            var luminance =
                (bg.Red * 0.299f +
                 bg.Green * 0.587f +
                 bg.Blue * 0.114f) / 255f;

            return luminance > 0.5f
                ? ScoreboardUtilities.HexToRgb("#212121")
                : ScoreboardUtilities.HexToRgb("#FFFFFF");
        }

        Background = ScoreboardUtilities.HexToRgb("#EEEEEE");

        VoterHeader = main;
        VoterHeaderText = ChooseTextColor(main);

        ContestHeader = accent;
        ContestHeaderText = ChooseTextColor(accent);

        Flag = ScoreboardUtilities.HexToRgb("#FAFAFA");
        FlagBorder = ScoreboardUtilities.HexToRgb("#C4C4C4");

        EntryDetails = ScoreboardUtilities.HexToRgb("#FAFAFA");
        EntryDetailsBorder = ScoreboardUtilities.HexToRgb("#C4C4C4");
        EntryDetailsText = ScoreboardUtilities.HexToRgb("#212121");
        CountryText = ScoreboardUtilities.HexToRgb("#7E7E7E");

        TotalPoints = main;
        TotalPointsText = VoterHeaderText;

        ReceivedPoints = accent;
        ReceivedPointsText = ContestHeaderText;

        DqedPoints = ScoreboardUtilities.HexToRgb("#C4C4C4");
        DqedPointsText = ScoreboardUtilities.HexToRgb("#212121");

        DividerLine = ScoreboardUtilities.HexToRgb("#C4C4C4");
    }
}
