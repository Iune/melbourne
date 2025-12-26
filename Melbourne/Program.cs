namespace Melbourne;

class Program
{
    private static void Main(string[] args)
    {
        // Required for ExcelDataReader on .NET 5.0+
        System.Text.Encoding.RegisterProvider(
            System.Text.CodePagesEncodingProvider.Instance);

        var contest = ContestLoader.GetContestFromFile("/Users/aditya/Development/contests/melbourne-dotnet/resources/1988.xlsx",
            false);
        contest.PrintFinalResults();
        
        
        Console.WriteLine("Hello, World!");
    }
}