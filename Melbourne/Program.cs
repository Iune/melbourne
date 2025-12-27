using System.Diagnostics;

namespace Melbourne;

using Contest;
using Scoreboard;
using System;
using System.CommandLine;
using System.IO;

static class Program
{
    public static int Main(string[] args)
    {
        // Required
        var inputFileOption = new Option<FileInfo>("--input-file", "-i")
        {
            Description = "Path to input Excel file",
            Required = true
        };
        inputFileOption.Validators.Add(r =>
        {
            var inputFileInfo = r.GetRequiredValue(inputFileOption);
            if (!inputFileInfo.Exists)
            {
                r.AddError("Input file does not exist");
            }
        });

        var outputDirOption = new Option<DirectoryInfo>("--output-dir", "-o")
        {
            Description = "Directory to save scoreboards to",
            Required = true
        };
        var titleOption = new Option<string>("--title", "-t")
        {
            Description = "Contest title",
            Required = true
        };

        // Optional
        var mainColorOption = new Option<string>("--main-color", "-m")
        {
            Description = "Main color in HEX format",
            DefaultValueFactory = _ => Defaults.DefaultMainColor
        };
        var accentColorOption = new Option<string>("--accent-color", "-a")
        {
            Description = "Accent color in HEX format",
            DefaultValueFactory = _ => Defaults.DefaultAccentColor
        };

        // Boolean flags
        var hasCountColumnOption = new Option<bool>("--has-count-column", "-c")
        {
            Description = "Excel spreadsheet includes 'Count' column",
        };
        var noDisplayFlagsOption = new Option<bool>("--no-display-flags")
        {
            Description = "Disable displaying flags",
        };
        var noDisplayFlagBordersOption = new Option<bool>("--no-display-flags-borders")
        {
            Description = "Disable displaying borders around flags",
        };
        var noResultsInTitleOption = new Option<bool>("--no-results-in-title")
        {
            Description = "Don't append 'Results' to the contest title",
        };

        var root = new RootCommand("Scoreboard generator")
        {
            inputFileOption,
            outputDirOption,
            titleOption,
            mainColorOption,
            accentColorOption,
            hasCountColumnOption,
            noDisplayFlagsOption,
            noDisplayFlagBordersOption,
            noResultsInTitleOption
        };

        root.SetAction(parseResult =>
        {
            if (parseResult.Errors.Count == 0)
            {
                var inputFile = parseResult.GetRequiredValue(inputFileOption);
                var outputDir = parseResult.GetRequiredValue(outputDirOption);
                var title = parseResult.GetRequiredValue(titleOption);
                var mainColor = parseResult.GetValue(mainColorOption);
                var accentColor = parseResult.GetValue(accentColorOption);
                var hasCountColumn = parseResult.GetValue(hasCountColumnOption);
                var displayFlags = !parseResult.GetValue(noDisplayFlagsOption);
                var displayFlagBorders = displayFlags && !parseResult.GetValue(noDisplayFlagBordersOption);
                var appendResultsToTitle = !parseResult.GetValue(noResultsInTitleOption);

                Console.WriteLine($"inputFile => {inputFile.FullName}");
                Console.WriteLine($"outputDir => {outputDir.FullName}");
                Console.WriteLine($"title => {title}");
                Console.WriteLine($"mainColor => {mainColor ?? "(default)"}");
                Console.WriteLine($"accentColor => {accentColor ?? "(default)"}");
                Console.WriteLine($"hasCountColumn => {hasCountColumn}");
                Console.WriteLine($"displayFlags => {displayFlags}");
                Console.WriteLine($"displayFlagBorders => {displayFlagBorders}");
                Console.WriteLine($"appendResultsToTitle => {appendResultsToTitle}");

                if (!outputDir.Exists)
                {
                    Console.WriteLine($"Creating output directory: {outputDir.FullName}");
                    outputDir.Create();
                }

                // Required for ExcelDataReader on .NET 5.0+
                System.Text.Encoding.RegisterProvider(
                    System.Text.CodePagesEncodingProvider.Instance);

                var contest = ContestLoader.GetContestFromFile(inputFile.FullName, false);
                Console.Write($"\n{title} Results");
                contest.PrintFinalResults();

                var assetRoot = Path.Combine(AppContext.BaseDirectory, "Assets");
                var fontsConfig = new FontsConfig(
                    Path.Combine(assetRoot, "fonts", "ZillaSlab-Regular.otf"),
                    Path.Combine(assetRoot, "fonts", "FiraSans-Regular.otf"));
                var config = new Config(contest,
                    Path.Combine(assetRoot, "flags"),
                    outputDir.FullName,
                    title,
                    fontsConfig,
                    mainColor, accentColor, displayFlags, displayFlagBorders, appendResultsToTitle);

                var sw = Stopwatch.StartNew();
                Scoreboard.Scoreboard.GenerateContestScoreboards(config);
                sw.Stop();
                Console.WriteLine("Generated scoreboards in {0} milliseconds", sw.ElapsedMilliseconds);
            }
        });

        return root.Parse(args).Invoke();
    }
}