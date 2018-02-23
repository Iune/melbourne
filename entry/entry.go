package entry

import "sort"

type Entry struct {
	User, Flag, Artist, Song string
	NumVoters                int
	Votes                    []string
	Points                   int
	DisplayPoints            int
	IsDisqualified           bool
}

func (e *Entry) AddPoints(points int) {
	e.NumVoters++
	e.DisplayPoints += points
	if e.IsDisqualified == false {
		e.Points += points
	}
}

func (e *Entry) Disqualify() {
	e.Points = -1
	e.IsDisqualified = true
}

func SortEntries(entries []*Entry) {
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].Points == entries[j].Points {
			if entries[i].DisplayPoints == entries[j].DisplayPoints {
				if entries[i].NumVoters == entries[j].NumVoters {
					return entries[i].User < entries[j].User
				}
				return entries[i].NumVoters > entries[j].NumVoters
			}
			return entries[i].DisplayPoints > entries[j].DisplayPoints
		}
		return entries[i].Points > entries[j].Points
	})
}
