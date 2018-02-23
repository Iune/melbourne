package scoreboard

import (
	"fmt"
	"math"
	"os"
	"log"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/fogleman/gg"
	"github.com/iune/melbourne/contest"
	"github.com/iune/melbourne/entry"
	"github.com/lucasb-eyer/go-colorful"
	"github.com/nfnt/resize"
	"golang.org/x/image/font"
)

// Options struct contains options for the generated scoreboards
type Options struct {
	DisplayFlags    bool
	ContestName     string
	Scale           float64
	OutputDirectory string
	AccentColor     string
}

type fonts struct {
	voterHeader   font.Face
	header        font.Face
	user          font.Face
	entry         font.Face
	awardedPoints font.Face
	totalPoints   font.Face
}

func getFonts(scale float64) *fonts {
	voterHeader, _ := gg.LoadFontFace("fonts/Inconsolata-Regular.ttf", 14*scale)
	header, _ := gg.LoadFontFace("fonts/Inconsolata-Bold.ttf", 14*scale)
	user, _ := gg.LoadFontFace("fonts/Inconsolata-Regular.ttf", 12*scale)
	entry, _ := gg.LoadFontFace("fonts/Inconsolata-Regular.ttf", 12*scale)
	awardedPoints, _ := gg.LoadFontFace("fonts/Inconsolata-Regular.ttf", 14*scale)
	totalPoints, _ := gg.LoadFontFace("fonts/Inconsolata-Bold.ttf", 14*scale)

	return &fonts{
		voterHeader:   voterHeader,
		header:        header,
		user:          user,
		entry:         entry,
		awardedPoints: awardedPoints,
		totalPoints:   totalPoints,
	}
}

type sizes struct {
	voterString int
	entryString float64
	userString  float64
	header      int
	width       float64
	height      float64
	rectangle   float64
	flagOffset  float64
}

func getSizes(contest *contest.Contest, options *Options, voterNum int) *sizes {
	fonts := getFonts(options.Scale)
	sc := gg.NewContext(1, 1)

	// Voter string size
	sc.SetFontFace(fonts.voterHeader)
	voterString := fmt.Sprintf("Now Voting: %s (%d/%d)", contest.Voters[voterNum], voterNum+1, len(contest.Voters))
	currentVoterSize, _ := sc.MeasureString(voterString)

	// Longest artist + song length
	sc.SetFontFace(fonts.entry)
	longestEntryStringSize := 0.0
	for _, entry := range contest.Entries {
		entryString := fmt.Sprintf("%s – %s", entry.Artist, entry.Song)
		currentEntryStringSize, _ := sc.MeasureString(entryString)
		if currentEntryStringSize > longestEntryStringSize {
			longestEntryStringSize = currentEntryStringSize
		}
	}

	// Longest user
	sc.SetFontFace(fonts.user)
	longestUserStringSize := 0.0
	for _, entry := range contest.Entries {
		userString := fmt.Sprintf("%s", entry.User)
		currentUserStringSize, _ := sc.MeasureString(userString)
		if currentUserStringSize > longestUserStringSize {
			longestUserStringSize = currentUserStringSize
		}
	}

	// Header Size
	sc.SetFontFace(fonts.header)
	headerString := fmt.Sprintf("%s Results", options.ContestName)
	headerSize, _ := sc.MeasureString(headerString)

	// Flag Offset
	flagOffset := 0.0
	if options.DisplayFlags {
		flagOffset = 24 * options.Scale
	}

	// Rectangle
	rectangle := math.Max(longestEntryStringSize, longestUserStringSize)
	rectangle += 80*options.Scale + float64(flagOffset)

	// Width
	width := math.Max(math.Max(30*options.Scale+2*rectangle, 48*options.Scale+headerSize), 10*options.Scale+currentVoterSize)

	// Height
	leftColumn := len(contest.Entries)/2 + len(contest.Entries)%2
	height := 2*options.Scale + 35*options.Scale*float64(leftColumn) + 80*options.Scale

	return &sizes{
		voterString: int(currentVoterSize),
		entryString: longestEntryStringSize,
		userString:  longestUserStringSize,
		header:      int(headerSize),
		flagOffset:  flagOffset,
		rectangle:   rectangle,
		width:       width,
		height:      height,
	}
}

// GenerateScoreboards iterates through a contest's voters, producing the results at each stage
// of the voting process along with the scoreboards
func GenerateScoreboards(contest *contest.Contest, options *Options) {
	for voterNum, voter := range contest.Voters {
		votes := make([]string, 0)
		for _, currentEntry := range contest.Entries {
			rawPoints := currentEntry.Votes[voterNum]
			if strings.TrimSpace(strings.ToLower(rawPoints)) == "dq" {
				currentEntry.Disqualify()
			}
			// TODO: Figure out why ParseInt isn't returning an int
			if intPoints, err := strconv.ParseInt(rawPoints, 10, 0); err == nil {
				currentEntry.AddPoints(int(intPoints))
			}
			votes = append(votes, rawPoints)
		}
		entry.SortEntries(contest.Entries)

		// Do scoreboard stuff here
		fmt.Printf("Generating Scoreboard (%d/%d): %s\n", voterNum+1, len(contest.Voters), voter)
		GenerateScoreboard(contest, voterNum, options)
	}

	for _, entry := range contest.Entries {
		fmt.Println(entry.User, entry.DisplayPoints)
	}
}

type colors struct {
	lightGrey, white, black, textGrey, textCaption, textWhite, main, accent, accentText string
}

// Given the accent color for the scoreboard, returns a colors struct with
// the color values for the scoreboard. The accentText color is dynamically
// calculated to be either black/white depending on the accent color.
func getColors(accent string) *colors {
	color, _ := colorful.Hex(accent)

	redFloat := color.R * 255
	greenFloat := color.G * 255
	blueFloat := color.B * 255

	yiq := (redFloat*299 + greenFloat*587 + blueFloat*114) / 1000
	accentText := "FFFFFF"
	if yiq >= 128 {
		accentText = "#212121"
	}

	return &colors{
		accent:      accent,
		main:        "#2F292B",
		lightGrey:   "#EEEEEE",
		white:       "#FAFAFA",
		black:       "#212121",
		textGrey:    "#C4C4C4",
		textWhite:   "#FFFFFF",
		textCaption: "#7E7E7E",
		accentText:  accentText,
	}
}

// Helper function to reduce number of function calls in GenerateScoreboard
func drawRectangle(dc *gg.Context, x float64, y float64, width float64, height float64, color string) {
	dc.DrawRectangle(x, y, width, height)
	dc.SetHexColor(color)
	dc.Fill()
}

// Helper function to reduce number of function calls in GenerateScoreboard
func drawText(dc *gg.Context, text string, x float64, y float64, ax float64, ay float64, font font.Face, color string) {
	dc.SetFontFace(font)
	dc.SetHexColor(color)
	dc.DrawStringAnchored(text, x, y, ax, ay)
}

// GenerateScoreboard creates an individual scoreboard (PNG file) based on the current
// standings of the contest, along with the options for the scoreboard
func GenerateScoreboard(contest *contest.Contest, voterNum int, options *Options) {
	fonts := getFonts(options.Scale)
	sizes := getSizes(contest, options, voterNum)
	colors := getColors(options.AccentColor)

	dc := gg.NewContext(int(sizes.width), int(sizes.height))

	// Background
	drawRectangle(dc, 0, 0, sizes.width, sizes.height, colors.lightGrey)

	// Voter Header
	drawRectangle(dc, 0, 0, sizes.width, 30*options.Scale, colors.main)
	voterHeaderText := fmt.Sprintf("Now Voting: %s (%d/%d)", contest.Voters[voterNum], voterNum+1, len(contest.Voters))
	drawText(dc, voterHeaderText, 10*options.Scale, 20*options.Scale, 0, 0, fonts.voterHeader, colors.textWhite)

	// Contest Header
	drawRectangle(dc, 0, 30*options.Scale, sizes.width, 30*options.Scale, colors.accent)
	contestHeaderText := fmt.Sprintf("%s Results", options.ContestName)
	drawText(dc, contestHeaderText, 10*options.Scale, 43*options.Scale, 0, 0.5, fonts.header, colors.accentText)

	// Rectangles
	leftColumn := len(contest.Entries)/2 + len(contest.Entries)%2
	rightColumn := len(contest.Entries) - leftColumn

	// We need to manually draw the rectangles, so we can draw a border
	dc.DrawRectangle(10*options.Scale, 70*options.Scale, sizes.rectangle, 2*options.Scale+35*options.Scale*float64(leftColumn))
	dc.SetHexColor(colors.white)
	dc.FillPreserve()
	dc.SetLineWidth(1.0)
	dc.SetHexColor(colors.textGrey)
	dc.Stroke()

	dc.DrawRectangle(20*options.Scale+sizes.rectangle, 70*options.Scale, sizes.rectangle, 2*options.Scale+35*options.Scale*float64(rightColumn))
	dc.SetHexColor(colors.white)
	dc.FillPreserve()
	dc.SetLineWidth(1.0)
	dc.SetHexColor(colors.textGrey)
	dc.Stroke()

	for index, entry := range contest.Entries {
		xOffset := 10*options.Scale + sizes.rectangle
		yOffset := float64(index - leftColumn)

		if index < leftColumn {
			xOffset = 0
			yOffset = float64(index)
		}

		// Display flags
		if options.DisplayFlags {
			flagLocation := fmt.Sprintf("flags/%s", entry.Flag)
			image, err := gg.LoadPNG(flagLocation)
			if err != nil {
				log.Fatal(err)
			}
			image = resize.Thumbnail(uint(22*options.Scale), uint(22*options.Scale), image, resize.Bilinear)
			iw, ih := image.Bounds().Dx(), image.Bounds().Dy()
			dc.DrawImageAnchored(image, int(27*options.Scale+xOffset), int(87*options.Scale+35*options.Scale*yOffset), 0.5, 0.5)
			// dc.DrawRectangle(float64(16*options.Scale+xOffset), float64(76*options.Scale+35*options.Scale*yOffset), 22*options.Scale, 22*options.Scale)
			dc.DrawRectangle(float64(27*options.Scale+xOffset - float64(iw)/2), float64(87*options.Scale+35*options.Scale*yOffset - float64(ih)/2), float64(iw), float64(ih))
			dc.SetHexColor(colors.textGrey)
			dc.SetLineWidth(0.5)
			dc.Stroke()
		}

		// Display entry header (i.e. user/country)
		entryHeaderText := fmt.Sprintf("%s", entry.User)
		drawText(dc, entryHeaderText, 20*options.Scale+xOffset+sizes.flagOffset, 78*options.Scale+35*options.Scale*yOffset, 0, 0.5, fonts.user, colors.textCaption)

		// Display entry string
		entryText := fmt.Sprintf("%s – %s", entry.Artist, entry.Song)
		drawText(dc, entryText, 20*options.Scale+xOffset+sizes.flagOffset, 92*options.Scale+35*options.Scale*yOffset, 0, 0.5, fonts.entry, colors.black)

		// Display entry's total points
		if entry.IsDisqualified {
			drawRectangle(dc, 30*options.Scale+xOffset+sizes.flagOffset+math.Max(sizes.entryString, sizes.userString), 79*options.Scale+35*options.Scale*yOffset, 30*options.Scale, 20*options.Scale, colors.textCaption)
		} else {
			drawRectangle(dc, 30*options.Scale+xOffset+sizes.flagOffset+math.Max(sizes.entryString, sizes.userString), 79*options.Scale+35*options.Scale*yOffset, 30*options.Scale, 20*options.Scale, colors.main)
		}
		totalPointsText := strconv.Itoa(entry.DisplayPoints)
		drawText(dc, totalPointsText, 45*options.Scale+xOffset+sizes.flagOffset+math.Max(sizes.entryString, sizes.userString), 87*options.Scale+35*options.Scale*yOffset, 0.5, 0.5, fonts.totalPoints, colors.textWhite)

		// Display awarded points
		awardedPointsText := strings.TrimSpace(entry.Votes[voterNum])
		if len(awardedPointsText) > 0 {
			drawRectangle(dc, 60*options.Scale+xOffset+sizes.flagOffset+math.Max(sizes.entryString, sizes.userString), 79*options.Scale+35*options.Scale*yOffset, 22*options.Scale, 20*options.Scale, colors.accent)
			drawText(dc, awardedPointsText, 71*options.Scale+xOffset+sizes.flagOffset+math.Max(sizes.entryString, sizes.userString), 87*options.Scale+35*options.Scale*yOffset, 0.5, 0.5, fonts.awardedPoints, colors.accentText)
		}

		// Draw dividing line
		if index+1 != leftColumn && index+1 != len(contest.Entries) {
			dc.SetHexColor(colors.textGrey)
			dc.SetLineWidth(1.0)
			dc.DrawLine(10*options.Scale+xOffset, 106*options.Scale+35*options.Scale*yOffset, 10*options.Scale+xOffset+sizes.rectangle, 106*options.Scale+35*options.Scale*yOffset)
			dc.Stroke()
		}
	}

	outputFileName := fmt.Sprintf("%d – %s.png", voterNum+1, contest.Voters[voterNum])
	newpath := filepath.Join(options.OutputDirectory, outputFileName)
	os.MkdirAll(options.OutputDirectory, os.ModePerm)
	dc.SavePNG(newpath)
}
