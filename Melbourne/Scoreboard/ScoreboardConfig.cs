namespace Melbourne;

public sealed class ScoreboardConfig
{
    public Contest Contest { get; }
    public string FlagsDir { get; }
    public string OutputDir { get; }
    public string Title { get; }
    public ScoreboardFontsConfig FontsConfig { get; }

    public string? CustomFlagsDir { get; init; }
    public bool DisplayFlags { get; init; } = true;
    public bool DisplayFlagBorders { get; init; } = true;
    public bool AppendResultsToTitle { get; init; } = true;

    public string MainColor { get; init; } =
        ScoreboardDefaults.DefaultMainColor;

    public string AccentColor { get; init; } =
        ScoreboardDefaults.DefaultAccentColor;

    public ScoreboardConfig(
        Contest contest,
        string flagsDir,
        string outputDir,
        string title,
        ScoreboardFontsConfig fontsConfig)
    {
        Contest = contest;
        FlagsDir = flagsDir;
        OutputDir = outputDir;
        Title = title;
        FontsConfig = fontsConfig;
    }
}
