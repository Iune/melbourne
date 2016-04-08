from math import ceil
from PIL import Image, ImageDraw, ImageFont
from unidecode import unidecode
import copy
import json
import os

# Function taken from http://stackoverflow.com/questions/214359/converting-hex-color-to-rgb-and-vice-versa
def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))

# A helper function which loads a json file with various permissible country names 
# (according to ISO standards), in order to map the two letter ISO code to the country's full name.
def isoToCountry():
    flags = {}
    with open("Resources/countries.json", "r") as f:
        temp = json.load(f)
    for item in temp:
        flags[item['name']] = item['alpha-2']
    return flags

# Makes sure the output directory exists. If it doesn't it creates said directory.
def prepareOutputDirectory():
    if not os.path.isdir('Output'):
        os.makedirs('Output', exist_ok=True)

# Strips diacritics and other special characters from voter names for use in creating 
# filesafe output file names
def safeFileName(filename):
    safe = filename.strip()
    for c in r'[]/\;,><&*:%=+@!#^()|?^':
        safe = safe.replace(c,'')
    safe = unidecode(safe)
    return safe

# Generates a scoreboard image that is inspired by Google's Material Design design guidelines
def generateScoreboardMaterial(contest, sortedData, currentVoterNumber, color="#009688", colorDark="#2f292b", displayFlags=True, displayCountries=False):
    prepareOutputDirectory()
    flags = isoToCountry()
    safeVoterName = safeFileName(contest.voters[currentVoterNumber])    
    scale = 3
    
    # Fonts
    voterHeaderFont = ImageFont.truetype("RobotoCondensed-Regular.ttf", 12*scale, encoding="unic")
    headerFont = ImageFont.truetype("RobotoCondensed-Bold.ttf", 21*scale, encoding="unic")
    countryFont = ImageFont.truetype("RobotoCondensed-Regular.ttf", 10*scale, encoding="unic")
    songFont = ImageFont.truetype("RobotoCondensed-Regular.ttf", 10*scale, encoding="unic")
    pointsFont = ImageFont.truetype("RobotoCondensed-Light.ttf", 14*scale, encoding="unic")
    totalFont = ImageFont.truetype("RobotoCondensed-Bold.ttf", 14*scale, encoding="unic")
    
    # Colors
    lightGrey = (238, 238, 238)
    white = (250, 250, 250)
    black = (33, 33, 33)
    textGreyMain = (196, 196, 196)
    textGreyCaption = (126, 126, 126)
    textWhite = (255, 255, 255)
    color = hex_to_rgb(color)
    colorDark = hex_to_rgb(colorDark)

    # If we are going to display flags, the text should be offset by 24 pixels to accomodate the flags
    flagOffset = 0
    if displayFlags:
        flagOffset = 24*scale 



    # We base the size of the image from the length of the longest entry or voter (which ever one is bigger)
    longestString = ""
    for entry in sortedData:
        tmp = "{} - {}".format(entry['artist'].upper(), entry['song'].upper())
        if len(tmp) > len(longestString):
            longestString = tmp

    img = Image.new('RGBA', size=(1, 1))
    draw = ImageDraw.Draw(img)

    entrySize = (0,0)
    userSize = (0,0)
    for entry in sortedData:
        entryTmp = draw.textsize("{} - {}".format(entry['artist'].upper(), entry['song'].upper()), font=songFont)
        if displayCountries:
        	userTmp = draw.textsize(entry['country'].upper(), font=countryFont)
    	else:
        	userTmp = draw.textsize(entry['user'].upper(), font=countryFont)

        if entryTmp[0] >= entrySize[0]:
            entrySize = entryTmp

        if userTmp[0] >= userSize[0]:
            userSize = userTmp

    rectWidth = max(entrySize[0], userSize[0]) + 80*scale + flagOffset
    width =  10*scale + (rectWidth) + 10*scale + (rectWidth) + 10*scale
    height = scale*(90 + 30*(int(contest.numEntries/2) + contest.numEntries%2) + 20)

    # Now, let's start with the actual scoreboard
    img = Image.new('RGBA', size=(width, height))
    draw = ImageDraw.Draw(img)

    # Background rectangle for image
    draw.rectangle(((0, 0), (width, height)), fill=lightGrey)

    # Voting Top Bar
    draw.rectangle(((0, 0), (width, 21*scale)), fill=colorDark)
    draw.text((5*scale, 3*scale), "Now Voting: {} ({}/{})".format(contest.voters[currentVoter], currentVoter+1, contest.numVoters), font=voterHeaderFont, fill=textWhite)
    # Contest Name Top Bar
    draw.rectangle(((0, 20*scale), (width, 65*scale)), fill=color)
    draw.text((24*scale, 31*scale), "{} Results".format(contest.name), font=headerFont, fill=textWhite)
 
    # How many entries should be in the left column of the scoreboard
    leftHalf = int(contest.numEntries/2) + contest.numEntries%2
    # Background rectangles for entries lists
    draw.rectangle(((10*scale, 90*scale), (10*scale+rectWidth, 90*scale+scale*30*leftHalf)), fill=white, outline=textGreyMain)
    draw.rectangle(((10*scale+rectWidth+10*scale, 90*scale), (10*scale+rectWidth+10*scale+rectWidth, 90*scale+scale*30*(leftHalf-contest.numEntries%2))), fill=white, outline=textGreyMain)

    for currentEntry in range(contest.numEntries):
        if currentEntry < leftHalf:
            xOffset = 0
            yOffset = currentEntry
        else:
            xOffset = 10*scale + rectWidth
            yOffset = currentEntry - leftHalf

        entry = sortedData[currentEntry]

        # Display the entry's country's flag (if displayFlags == True)
        if displayFlags:
            try:
                countryISO =  flags[entry['country']]
                flag = Image.open('Resources/Square/{}.png'.format(countryISO), 'r')
                flag = flag.resize((20*scale, 20*scale), Image.ANTIALIAS)
                img.paste(flag, (20*scale+xOffset, 95*scale + 30*yOffset*scale))
            except IndexError:
                countryISO = ""
            except KeyError:
                countryISO = ""

        # Display either the entry's country or user
        if displayCountries:
            countryString = entry['country']
        else:
            countryString = entry['user']
        draw.text((20*scale+xOffset+flagOffset, 93*scale+30*scale*yOffset), countryString.upper(), font=countryFont, fill=textGreyCaption)

        # Display the entry's artist and song title
        draw.text((20*scale+xOffset+flagOffset, 105.5*scale+30*scale*yOffset), "{} - {}".format(entry['artist'].upper(), entry['song'].upper()), font=songFont, fill=black)
 
        # Display the total points the entry currently has
        draw.rectangle(((xOffset+20*scale+flagOffset+size[0]+10*scale, 95*scale+30*scale*yOffset), (xOffset+20*scale+flagOffset+size[0]+10*scale+27*scale, 95*scale+30*scale*yOffset+20*scale)), fill=colorDark)
        totalSize = draw.textsize("{}".format(entry['display']), font=totalFont)
        draw.text((20*scale+xOffset+flagOffset+size[0]+10*scale+(27/2)*scale-(totalSize[0]/2.0), 97.5*scale+30*scale*yOffset), "{}".format(entry['display']), font=totalFont, fill=textWhite)                # dwg.add(dwg.text(insert=(267.5+xOffset,109.5+30*yOffset), text="{}".format(entry['display']), style="text-anchor: middle; font-size:14px; font-weight:700; font-family:'{}'; fill:{}; fill-opacity:1.00;".format(font, textWhite)))

        # Display the points awarded to the entry by the current voter
        if entry['data'][currentVoter] != 0 and entry['data'][currentVoter] != '':
            draw.rectangle(((xOffset+20*scale+flagOffset+size[0]+10*scale+27*scale, 95*scale+30*scale*yOffset), (xOffset+20*scale+flagOffset+size[0]+10*scale+27*scale+23*scale, 95*scale+30*scale*yOffset+20*scale)), fill=color)
            ptsSize = draw.textsize("{}".format(entry['data'][currentVoter].upper(), font=pointsFont))
            draw.text((20*scale+xOffset+flagOffset+size[0]+10*scale+27*scale+(22/2.0)*scale-(ptsSize[0]/2.0)*scale, 97.5*scale+30*scale*yOffset), "{}".format(entry['data'][currentVoter].upper()), font=pointsFont, fill=textWhite)        

        # Draw a dividing line between entries 
        if currentEntry+1 != leftHalf and currentEntry+1 != (contest.numEntries):
            draw.line((10*scale+xOffset, 120*scale+30*scale*yOffset, 10*scale+rectWidth+xOffset, 120*scale+30*scale*yOffset), fill=textGreyMain, width=1)

    img.save('{}/{} - {}.png'.format('Output', currentVoter+1, safeVoterName))