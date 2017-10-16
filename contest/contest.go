package contest

import (
	"io"
	"io/ioutil"
	"strings"

	"github.com/iune/melbourne/entry"
	"github.com/jfyne/csvd"
)

type Contest struct {
	Entries []*entry.Entry
	Voters  []string
}

func GetContestFromFile(fileLocation string) *Contest {
	fileContents, err := ioutil.ReadFile(fileLocation)
	if err != nil {
		panic(err)
	}

	entries := make([]*entry.Entry, 0)
	voters := make([]string, 0)

	r := csvd.NewReader(strings.NewReader(string(fileContents)))
	isHeaderRow := true
	for {
		record, err := r.Read()
		// Check if end of file
		if err == io.EOF {
			break
		}
		// Check for errors
		if err != nil {
			panic(err)
		}
		// Check to see if valid row
		if len(record) < 5 {
			continue
		}
		// Check to see if header row
		if isHeaderRow {
			voters = record[6:]
			isHeaderRow = false
			continue
		}

		// Add entry to list of entries
		entries = append(entries, &entry.Entry{
			User:           record[1],
			Flag:           record[2],
			Artist:         record[3],
			Song:           record[4],
			Votes:          record[6:],
			IsDisqualified: false,
		})
	}

	return &Contest{entries, voters}
}
