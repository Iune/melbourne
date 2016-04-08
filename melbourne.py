import argparse
import csv
import scoreboards

class Contest:
    def __init__(self, name, rawData, preparedData):
        self.name = name
        self.data = preparedData

        self.voters = rawData[0][5:]
        self.numVoters = len(self.voters)
        self.numEntries = len(self.data)


def loadData(fileLocation):
    data = []
    with open(fileLocation) as file:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(file.readline())

    with open(fileLocation) as file:
        reader = csv.reader(file, delimiter=dialect.delimiter)
        for row in reader:
            data.append(row[1:])
    return data


def prepareData(data, contestName):
    preparedData = []
    for row in data[1:]:
        rowDict = {'user':row[0], 'country':row[1], 'artist':row[2], 'disqualified':False, 'song':row[3], 'total':0, 'display':0, 'count':0, 'data':row[5:]}
        preparedData.append(rowDict)
    contest = Contest(contestName, data, preparedData)
    return contest


def processVoter(contest, currentVoterNumber):
    for row in contest.data:
        if row['data'][currentVoterNumber].upper() == 'DQ':
            row['disqualified'] = True
            row['total'] = -1
        try:
            points = int(row['data'][currentVoterNumber])
            if not row['disqualified']:
                row['total'] += points
            row['display'] += points
            row['count'] += 1
        except ValueError:
            continue
    # Sort the results from largest to smallest by the entry's points, then by the number of voters who voted for it, and then 
    # by the entry artist's name alphabetically
    sortedData = sorted(contest.data, key=lambda k: (-k['total'], -k['display'], -k['count'], k['artist'].lower()))
    return sortedData


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Input CSV file location")
    parser.add_argument("name", help="Contest name")
    parser.add_argument("-f", "--flags", help="Display flags in the scoreboards", action="store_true")
    parser.add_argument("-c", "--countries", help="Display country names instead of usernames in the scoreboards", action="store_true")
    parser.add_argument("--color", help="Light color used in the scoreboards (Default: #009688)", dest="color")    
    parser.add_argument("--colorDark", help="Dark color used in the scoreboards (Default: #2f292b)", dest="colorDark")    
    args = parser.parse_args()

    # Load and pre-process the input data
    rawData = loadData(args.file)
    contest = prepareData(rawData, args.name)

    # Have each voter add their votes, and generate a scoreboard of the results after that voter
    for i in range(contest.numVoters):
        # Add voter's votes and sort results
        sortedData = processVoter(contest, i)
        print("Generating Scoreboard {}/{} ({})".format(i+1, contest.numVoters, contest.voters[i]))
        # Generate scoreboard
        # If both color and colorDark values were not passed in, use default values
        if(args.colorDark == None and args.color == None):
            scoreboards.generateScoreboardMaterial(contest, sortedData, i, displayFlags=args.flags, displayCountries=args.countries)
        # If only color's value was passed in, use that value and the default colorDark value
        elif(args.colorDark == None and args.color != None):
            scoreboards.generateScoreboardMaterial(contest, sortedData, i, displayFlags=args.flags, displayCountries=args.countries, color=args.color)            
        # Otherwise (both color and colorDark's values were passed in), use their given values
        else:
            scoreboards.generateScoreboardMaterial(contest, sortedData, i, displayFlags=args.flags, displayCountries=args.countries, color=args.color, colorDark=args.colorDark)            


if __name__ == "__main__":
    main()