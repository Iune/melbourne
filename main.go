package main

import (
	"flag"
	"fmt"

	"github.com/iune/melbourne/contest"
	"github.com/iune/melbourne/scoreboard"
)

func main() {
	fileLocation := flag.String("input", "", "Path to input CSV file")
	outputDirectory := flag.String("output", "", "Path to output directory for scoreboards. Directory will be created if nonexistent.")
	contestName := flag.String("name", "", "Contest name")
	accent := flag.String("accent", "#FCB906", "Accent color in HEX format. Must be in format \"#XXXXXX\" with the initial '#'")
	displayFlags := flag.Bool("displayFlags", false, "Display flags in scoreboards.")
	flag.Parse()

	if len(*contestName) < 1 {
		fmt.Println("Contest name was not specified.")
		return
	}

	contest := contest.GetContestFromFile(*fileLocation)
	options := scoreboard.Options{
		ContestName:     *contestName,
		OutputDirectory: *outputDirectory,
		AccentColor:     *accent,
		DisplayFlags:    *displayFlags,
		Scale:           2.0,
	}
	scoreboard.GenerateScoreboards(contest, &options)
}
