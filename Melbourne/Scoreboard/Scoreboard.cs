namespace Melbourne.Scoreboard;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SkiaSharp;

public static class Scoreboard
{
    
        private static string SanitizeFileName(string fileName)
        {
            foreach (var c in Path.GetInvalidFileNameChars())
                fileName = fileName.Replace(c, '_');
            return fileName;
        }

        public static string GenerateScoreboard(
            Config config,
            Fonts fonts,
            Colors colors,
            int voterIdx)
        {
            var sizes = new Sizes(fonts, config, voterIdx);
            float scaling = sizes.ScalingRatio;

            using var bitmap = new SKBitmap((int)sizes.Width, (int)sizes.Height);
            using var canvas = new SKCanvas(bitmap);

            // Clear background
            canvas.Clear(colors.Background);

            // Voter header
            Utilities.DrawRectangle(canvas, (0, 0), sizes.Width, 30f * scaling, fillColor: colors.VoterHeader);
            Utilities.DrawText(
                canvas,
                (10f * scaling, 15f * scaling),
                $"Now Voting: {config.Contest.VoterNames[voterIdx]} ({voterIdx + 1}/{config.Contest.NumVoters})",
                fonts.VoterHeader,
                colors.VoterHeaderText,
                Utilities.TextAlignment.Left);

            // Contest header
            Utilities.DrawRectangle(canvas, (0, 30f * scaling), sizes.Width, 30f * scaling, fillColor: colors.ContestHeader);
            Utilities.DrawText(
                canvas,
                (10f * scaling, 45f * scaling),
                config.AppendResultsToTitle ? $"{config.Title} Results" : config.Title,
                fonts.ContestHeader,
                colors.ContestHeaderText,
                Utilities.TextAlignment.Left);

            // Background rectangles for entries
            int numLeft = config.Contest.NumEntries / 2 + config.Contest.NumEntries % 2;
            int numRight = config.Contest.NumEntries - numLeft;

            Utilities.DrawRectangle(
                canvas,
                (10f * scaling, 70f * scaling),
                sizes.Rectangle,
                35f * scaling * numLeft,
                fillColor: colors.EntryDetails,
                strokeColor: colors.EntryDetailsBorder,
                strokeWidth: 2f);

            Utilities.DrawRectangle(
                canvas,
                (20f * scaling + sizes.Rectangle, 70f * scaling),
                sizes.Rectangle,
                35f * scaling * numRight,
                fillColor: colors.EntryDetails,
                strokeColor: colors.EntryDetailsBorder,
                strokeWidth: 2f);

            // Draw entry details
            var entries = config.Contest.ResultsAfterVoter(voterIdx);
            for (int i = 0; i < entries.Count; i++)
            {
                var entry = entries[i];
                float xOffset = i < numLeft ? 0f : 10f * scaling + sizes.Rectangle;
                float yOffset = i < numLeft ? i : i - numLeft;

                // Draw flag
                if (config.DisplayFlags)
                {
                    string flagPath = Path.Combine(config.FlagsDir, entry.Flag);
                    if (File.Exists(flagPath))
                    {
                        using var flag = Utilities.LoadImage(flagPath, 20f * scaling);
                        if (config.DisplayFlagBorders)
                        {
                            float fx = 27f * scaling - flag.Width / 2f + xOffset;
                            float fy = 87f * scaling - flag.Height / 2f + 35f * scaling * yOffset;
                            Utilities.DrawImage(canvas, flag, fx, fy, strokeColor: colors.FlagBorder, strokeWidth: 1f);
                        }
                        else
                        {
                            float fx = 27f * scaling - flag.Width / 2f + xOffset;
                            float fy = 87f * scaling - flag.Height / 2f + 35f * scaling * yOffset;
                            Utilities.DrawImage(canvas, flag, fx, fy);
                        }
                    }
                }

                // Entry text
                float baseX = 20f * scaling + xOffset + sizes.FlagOffset;
                Utilities.DrawText(canvas, (baseX, 80f * scaling + 35f * scaling * yOffset), entry.Country, fonts.Country, colors.CountryText, Utilities.TextAlignment.Left);
                Utilities.DrawText(canvas, (baseX, 94f * scaling + 35f * scaling * yOffset), $"{entry.Artist} – {entry.Song}", fonts.EntryDetails, colors.EntryDetailsText, Utilities.TextAlignment.Left);

                // Total points
                var totalPtsColor = entry.DqStatuses[voterIdx] ? colors.DqedPoints : colors.TotalPoints;
                var totalPtsTextColor = entry.DqStatuses[voterIdx] ? colors.DqedPointsText : colors.TotalPointsText;

                Utilities.DrawRectangle(
                    canvas,
                    (30f * scaling + xOffset + sizes.FlagOffset + sizes.EntryDetailsWidth,
                     77f * scaling + 35f * scaling * yOffset),
                    29f * scaling,
                    20f * scaling,
                    fillColor: totalPtsColor);

                Utilities.DrawText(
                    canvas,
                    (44.5f * scaling + xOffset + sizes.FlagOffset + sizes.EntryDetailsWidth,
                     87f * scaling + 35f * scaling * yOffset),
                    entry.DisplayPoints[voterIdx].ToString(),
                    fonts.TotalPoints,
                    totalPtsTextColor,
                    Utilities.TextAlignment.Center);

                // Points received by current voter
                if (!string.IsNullOrEmpty(entry.Votes[voterIdx]))
                {
                    Utilities.DrawRectangle(
                        canvas,
                        (59f * scaling + xOffset + sizes.FlagOffset + sizes.EntryDetailsWidth,
                         77f * scaling + 35f * scaling * yOffset),
                        24f * scaling,
                        20f * scaling,
                        fillColor: colors.ReceivedPoints);

                    string receivedText = entry.Votes[voterIdx].EndsWith(".0")
                        ? ((int)float.Parse(entry.Votes[voterIdx])).ToString()
                        : entry.Votes[voterIdx];

                    Utilities.DrawText(
                        canvas,
                        (71f * scaling + xOffset + sizes.FlagOffset + sizes.EntryDetailsWidth,
                         87f * scaling + 35f * scaling * yOffset),
                        receivedText,
                        fonts.ReceivedPoints,
                        colors.ReceivedPointsText,
                        Utilities.TextAlignment.Center);
                }

                // Divider line
                Utilities.DrawLine(
                    canvas,
                    (10f * scaling + xOffset, 104.5f * scaling + 35f * scaling * yOffset),
                    (10f * scaling + xOffset + sizes.Rectangle, 104.5f * scaling + 35f * scaling * yOffset),
                    colors.DividerLine,
                    0.5f * scaling);
            }

            // Save image
            string fileName = SanitizeFileName($"{voterIdx + 1} - {config.Contest.VoterNames[voterIdx]}.png");
            string filePath = Path.Combine(config.OutputDir, fileName);

            using var image = SKImage.FromBitmap(bitmap);
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            using var stream = File.OpenWrite(filePath);
            data.SaveTo(stream);

            return filePath;
        }

        public static List<string> GenerateContestScoreboards(Config config)
        {
            var fonts = new Fonts(config.FontsConfig);
            var colors = new Colors(config.MainColor, config.AccentColor);

            var results = new string[config.Contest.NumVoters];
            Parallel.For(0, config.Contest.NumVoters, i =>
            {
                results[i] = GenerateScoreboard(config, fonts, colors, i);
            });

            return results.ToList();
        }
    }