using ClosedXML.Excel;

namespace Melbourne;

public class Contest
{
    public List<Entry> Entries { get; }
    public List<string> Voters { get; }

    public Contest(string filePath, bool containsCountColumn = true)
    {
        var wb = new XLWorkbook(filePath);
        var ws = wb.Worksheet(1);
        if (ws is null)
        {
            throw new NullReferenceException();
        }

        // Validate that the correct number of rows and columns were populated
        if (ws.CellsUsed().Count() < 7)
        {
            throw new ArgumentException("Excel sheet does not contain enough columns");
        }

        if (ws.RowsUsed().Count() < 2)
        {
            throw new ArgumentException("Excel sheet does not contain enough rows");
        }

        // Determine number of entry-detail columns to skip before reaching the first voter column
        var entryDataColumnsToSkip = 6;
        if (containsCountColumn)
            entryDataColumnsToSkip = 7;

        // Extract the voter names
        var headerRow = ws.Row(1);
        this.Voters = new List<string>();
        headerRow.CellsUsed().Skip(entryDataColumnsToSkip).ToList().ForEach(c => this.Voters.Add(c.GetString()));

        // Extract the entry details
        var lastVoterColumnNumber = headerRow.LastCellUsed().Address;
        this.Entries = new List<Entry>();
        foreach (var row in ws.RowsUsed().Skip(1))
        {
            var country = row.Cell(2).GetString().Trim();
            var flag = row.Cell(3).GetString().Trim();
            var artist = row.Cell(4).GetString().Trim();
            var song = row.Cell(5).GetString().Trim();

            var votes = new List<string>();
            row.Cells(1, lastVoterColumnNumber.ColumnNumber).Skip(entryDataColumnsToSkip).ToList()
                .ForEach(c => votes.Add(c.GetString().Trim()));
            this.Entries.Add(new Entry(country, flag, artist, song, votes));
        }
    }
}