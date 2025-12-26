namespace Melbourne;

using Contest;
using Scoreboard;

class Program
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

        var fontsConfig = new FontsConfig(
            "/Users/aditya/Development/contests/melbourne-dotnet/python/src/main/resources/base/fonts/ZillaSlab-Regular.otf",
            "/Users/aditya/Development/contests/melbourne-dotnet/python/src/main/resources/base/fonts/FiraSans-Regular.otf");
        var config = new Config(contest,
            "/Users/aditya/Development/contests/melbourne-dotnet/python/src/main/resources/base/flags",
            "/Users/aditya/Development/contests/melbourne-dotnet/tmp",
            "Eurovision 1988",
            fontsConfig,
            displayFlags: true);

        Scoreboard.Scoreboard.GenerateContestScoreboards(config);

        Console.WriteLine("Hello, World!");
    }
}