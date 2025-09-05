using CommandLine;

namespace Melbourne;

class Program
{
    class Options
    {
        [Option('i', "input", Required = true, HelpText = "Input Excel file to be processed.")]
        public required string ContestFile { get; set; }
        
        [Option('c', "count-column", HelpText = "Whether Excel file contains a 'Count' column")]
        public bool HasCountColumn { get; set; }
    }
    
    static void Main(string[] args)
    {
        Parser.Default.ParseArguments<Options>(args)
            .WithParsed<Options>(o =>
                {
                    Contest contest = new Contest(o.ContestFile, o.HasCountColumn);
                    Console.WriteLine($"Voters: {string.Join(", ", contest.Voters)}");
                    foreach (var entry in contest.Entries)
                    {
                        Console.WriteLine($"{entry.Country}: {entry.Artist} - {entry.Song}");
                        Console.WriteLine(string.Join("\t", entry.DisplayPoints));
                    }
                }        
            );

        
    }
}