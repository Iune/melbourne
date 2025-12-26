namespace Melbourne;

using SkiaSharp;

public sealed class Colors
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

    public Colors(
        string mainColorHex,
        string accentColorHex)
    {
        var main = Utilities.HexToRgb(mainColorHex);
        var accent = Utilities.HexToRgb(accentColorHex);

        static SKColor ChooseTextColor(SKColor bg)
        {
            var luminance =
                (bg.Red * 0.299f +
                 bg.Green * 0.587f +
                 bg.Blue * 0.114f) / 255f;

            return luminance > 0.5f
                ? Utilities.HexToRgb("#212121")
                : Utilities.HexToRgb("#FFFFFF");
        }

        Background = Utilities.HexToRgb("#EEEEEE");

        VoterHeader = main;
        VoterHeaderText = ChooseTextColor(main);

        ContestHeader = accent;
        ContestHeaderText = ChooseTextColor(accent);

        Flag = Utilities.HexToRgb("#FAFAFA");
        FlagBorder = Utilities.HexToRgb("#C4C4C4");

        EntryDetails = Utilities.HexToRgb("#FAFAFA");
        EntryDetailsBorder = Utilities.HexToRgb("#C4C4C4");
        EntryDetailsText = Utilities.HexToRgb("#212121");
        CountryText = Utilities.HexToRgb("#7E7E7E");

        TotalPoints = main;
        TotalPointsText = VoterHeaderText;

        ReceivedPoints = accent;
        ReceivedPointsText = ContestHeaderText;

        DqedPoints = Utilities.HexToRgb("#C4C4C4");
        DqedPointsText = Utilities.HexToRgb("#212121");

        DividerLine = Utilities.HexToRgb("#C4C4C4");
    }
}
