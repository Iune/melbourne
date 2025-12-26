namespace Melbourne;

using Contest;
using Scoreboard;
using System.IO;

static class Program
{
    private static void Main(string[] args)
    {
        // Required for ExcelDataReader on .NET 5.0+
        System.Text.Encoding.RegisterProvider(
            System.Text.CodePagesEncodingProvider.Instance);
        
        var contest = ContestLoader.GetContestFromFile(
            "/Users/aditya/Development/contests/melbourne-dotnet/resources/1988.xlsx",
            false);
        contest.PrintFinalResults();

        var assetRoot = Path.Combine(AppContext.BaseDirectory, "Assets");
        var fontsConfig = new FontsConfig(
            Path.Combine(assetRoot, "fonts", "ZillaSlab-Regular.otf"),
            Path.Combine(assetRoot, "fonts", "FiraSans-Regular.otf"));
        var config = new Config(contest,
            Path.Combine(assetRoot, "flags"),
            "/Users/aditya/Development/contests/melbourne-dotnet/tmp",
            "Eurovision 1988",
            fontsConfig,
            displayFlags: true);

        Scoreboard.Scoreboard.GenerateContestScoreboards(config);
    }
}