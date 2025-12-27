namespace Melbourne.Scoreboard;

public sealed class Config
{
    public Contest.Contest Contest { get; }
    public string FlagsDir { get; }
    public string OutputDir { get; }
    public string Title { get; }
    public FontsConfig FontsConfig { get; }
    public bool DisplayFlags { get; init; }
    public bool DisplayFlagBorders { get; init; }
    public bool AppendResultsToTitle { get; init; }

    public string MainColor { get; init; }
    public string AccentColor { get; init; }

    public Config(
        Contest.Contest contest,
        string flagsDir,
        string outputDir,
        string title,
        FontsConfig fontsConfig,
        string? mainColor = null,
        string? accentColor = null,
        bool displayFlags = true,
        bool displayFlagBorders = true,
        bool appendResultsToTitle = true)
    {
        Contest = contest;
        FlagsDir = flagsDir;
        OutputDir = outputDir;
        Title = title;
        FontsConfig = fontsConfig;
        MainColor = mainColor ?? Defaults.DefaultMainColor;
        AccentColor = accentColor ?? Defaults.DefaultAccentColor;
        DisplayFlags = displayFlags;
        DisplayFlagBorders = displayFlagBorders;
        AppendResultsToTitle = appendResultsToTitle;
    }
}
