namespace Melbourne;

public sealed class Config
{
    public Contest Contest { get; }
    public string FlagsDir { get; }
    public string OutputDir { get; }
    public string Title { get; }
    public FontsConfig FontsConfig { get; }

    public string? CustomFlagsDir { get; init; }
    public bool DisplayFlags { get; init; } = true;
    public bool DisplayFlagBorders { get; init; } = true;
    public bool AppendResultsToTitle { get; init; } = true;

    public string MainColor { get; init; } =
        Defaults.DefaultMainColor;

    public string AccentColor { get; init; } =
        Defaults.DefaultAccentColor;

    public Config(
        Contest contest,
        string flagsDir,
        string outputDir,
        string title,
        FontsConfig fontsConfig)
    {
        Contest = contest;
        FlagsDir = flagsDir;
        OutputDir = outputDir;
        Title = title;
        FontsConfig = fontsConfig;
    }
}
