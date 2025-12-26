namespace Melbourne.Contest;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ExcelDataReader;

public static class ContestLoader
{
    public static Contest GetContestFromFile(
        string filePath,
        bool hasCountColumn)
    {
        using var stream = File.Open(
            filePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read);

        return LoadFromStream(stream, hasCountColumn);
    }

    public static Contest GetContestFromFile(
        byte[] fileContents,
        bool hasCountColumn)
    {
        using var stream = new MemoryStream(fileContents);
        return LoadFromStream(stream, hasCountColumn);
    }

    private static Contest LoadFromStream(
        Stream stream,
        bool hasCountColumn)
    {
        using var reader = ExcelReaderFactory.CreateReader(stream);

        var dataSet = reader.AsDataSet(new ExcelDataSetConfiguration
        {
            ConfigureDataTable = _ => new ExcelDataTableConfiguration
            {
                UseHeaderRow = false
            }
        });

        var table = dataSet.Tables[0];

        var minRequiredCols = hasCountColumn ? 8 : 7;
        var startingVoteCol = hasCountColumn ? 7 : 6;

        if (table.Columns.Count < minRequiredCols)
        {
            throw new InvalidOperationException(
                "Excel sheet does not have enough columns");
        }

        if (table.Rows.Count < 2)
        {
            throw new InvalidOperationException(
                "Excel sheet does not have enough rows");
        }

        // Read voter names from header row (row 0)
        var voterNames = table.Rows[0]
            .ItemArray
            // Skip until we get the voter names
            .Skip(startingVoteCol)
            .Select(cell => cell?.ToString()?.Trim() ?? string.Empty)
            .ToList();

        var entries = new List<Entry>();

        // Read data rows (starting at row 1)
        for (var rowIndex = 1; rowIndex < table.Rows.Count; rowIndex++)
        {
            var row = table.Rows[rowIndex];

            var country = row[1]?.ToString()?.Trim() ?? string.Empty;
            var flag = row[2]?.ToString()?.Trim() ?? string.Empty;
            var artist = row[3]?.ToString()?.Trim() ?? string.Empty;
            var song = row[4]?.ToString()?.Trim() ?? string.Empty;

            // Stop reading once required fields are missing
            if (string.IsNullOrEmpty(country) ||
                string.IsNullOrEmpty(artist) ||
                string.IsNullOrEmpty(song))
            {
                break;
            }

            var votes = row.ItemArray
                .Skip(startingVoteCol)
                .Select(cell => cell?.ToString()?.Trim() ?? string.Empty)
                .ToList();

            var entry = new Entry(
                country: country,
                flag: flag,
                artist: artist,
                song: song,
                votes: votes);

            entries.Add(entry);
        }

        return new Contest(entries, voterNames);
    }
}
