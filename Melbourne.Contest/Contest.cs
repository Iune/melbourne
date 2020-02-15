using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using ExcelDataReader;

namespace Melbourne.Contest
{
    public class Contest
    {
        public List<Entry> Entries { get; }
        public List<string> Voters { get; }

        public Contest(List<Entry> entries, List<string> voters)
        {
            Entries = entries;
            Voters = voters;
        }

        public Contest(String fileLocation)
        {
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
            using var stream = File.Open(fileLocation, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var reader = ExcelReaderFactory.CreateReader(stream);

            DataSet spreadsheet = reader.AsDataSet();
            DataTable sheet = spreadsheet.Tables[0];

            // Validate number of columns
            if (sheet.Columns.Count < 7)
            {
                throw new ArgumentException("Excel sheet does not have enough columns");
            }

            // Validate number of rows
            if (sheet.Rows.Count < 2)
            {
                throw new ArgumentException("Excel sheet does not have enough rows");
            }

            // Load voters
            DataRow headerRow = sheet.Rows[0];
            Voters = new List<string>();
            foreach (DataColumn column in sheet.Columns.Cast<DataColumn>().Skip(6))
            {
                Voters.Add(headerRow[column].ToString());
            }

            // Load entries
            Entries = new List<Entry>();
            foreach (DataRow row in sheet.Rows.Cast<DataRow>().Skip(1))
            {
                string country = row[1].ToString();
                string flag = row[2].ToString();
                string artist = row[3].ToString();
                string song = row[4].ToString();

                List<string> votes = new List<string>();
                foreach (DataColumn column in sheet.Columns.Cast<DataColumn>().Skip(6))
                {
                    votes.Add(row[column].ToString());
                }

                Entries.Add(new Entry(country, flag, artist, song, votes));
            }
        }

        public int NumEntries
        {
            get => Entries.Count;
        }

        public int NumVoters
        {
            get => Voters.Count;
        }

        public List<Entry> ResultsAfterVoter(int voter)
        {
            if (voter < 0 || voter >= Voters.Count)
            {
                throw new ArgumentOutOfRangeException(String.Format("Voter number %d was invalid", voter));
            }

            return Entries
                .OrderByDescending(e => e.SortingPoints[voter])
                .ThenByDescending(e => e.DisplayPoints[voter])
                .ThenByDescending(e => e.VoterCount[voter])
                .ThenByDescending(e => e.PointsCountAfterVoter(12, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(10, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(8, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(7, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(6, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(5, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(4, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(3, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(2, voter))
                .ThenByDescending(e => e.PointsCountAfterVoter(1, voter))
                .ThenBy(e => e.Country)
                .ThenBy(e => e.Artist)
                .ThenBy(e => e.Song)
                .ToList();
        }

        public List<Entry> FinalResults
        {
            get
            {
                if (Voters.Count > 0)
                {
                    return ResultsAfterVoter(Voters.Count - 1);
                }
                else
                {
                    return Entries;
                }
            }
        }
    }
}
