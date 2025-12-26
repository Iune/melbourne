namespace Melbourne.Scoreboard;

using System.IO;
using SkiaSharp;

public sealed class Fonts
{
    public FontsConfig Config { get; }

    public SKFont VoterHeader { get; }
    public SKFont ContestHeader { get; }
    public SKFont Country { get; }
    public SKFont EntryDetails { get; }
    public SKFont TotalPoints { get; }
    public SKFont ReceivedPoints { get; }

    public Fonts(FontsConfig config)
    {
        Config = config;

        if (!File.Exists(config.BaseFontPath))
            throw new FileNotFoundException(
                $"Could not find base font: {config.BaseFontPath}");

        if (!File.Exists(config.PointsFontPath))
            throw new FileNotFoundException(
                $"Could not find points font: {config.PointsFontPath}");

        var baseTypeface = SKTypeface.FromFile(config.BaseFontPath);
        var pointsTypeface = SKTypeface.FromFile(config.PointsFontPath);

        var scale = Defaults.DefaultImageScalingRatio;

        VoterHeader = new SKFont(baseTypeface, 14 * scale);
        ContestHeader = new SKFont(baseTypeface, 14 * scale);
        Country = new SKFont(baseTypeface, 12 * scale);
        EntryDetails = new SKFont(baseTypeface, 12 * scale);
        TotalPoints = new SKFont(pointsTypeface, 14 * scale);
        ReceivedPoints = new SKFont(pointsTypeface, 14 * scale);
    }
}
