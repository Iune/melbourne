from math import ceil
from PIL import Image, ImageDraw, ImageFont, ImageOps
from unidecode import unidecode
import copy
import json
import os

def appendInt(num):
    if num > 9:
        secondToLastDigit = str(num)[-2]
        if secondToLastDigit == '1':
            return 'th'
    lastDigit = num % 10
    if (lastDigit == 1):
        return 'st'
    elif (lastDigit == 2):
        return 'nd'
    elif (lastDigit == 3):
        return 'rd'
    else:
        return 'th'

# Function taken from http://stackoverflow.com/questions/214359/converting-hex-color-to-rgb-and-vice-versa
def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))

# A helper function which loads a json file with various permissible country names 
# (according to ISO standards), in order to map the two letter ISO code to the country's full name.
def isoToCountry():
    flags = {}
    with open("Resources/countries.json", encoding="utf8") as f:
        temp = json.load(f)
    for item in temp:
        flags[item['name']] = item
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
    scale = 4
    
    # Fonts
    voterHeaderFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Regular.ttf", 12*scale, encoding="unic")
    headerFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Bold.ttf", 21*scale, encoding="unic")
    countryFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Regular.ttf", 10*scale, encoding="unic")
    songFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Regular.ttf", 10*scale, encoding="unic")
    pointsFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Light.ttf", 14*scale, encoding="unic")
    totalFont = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Bold.ttf", 14*scale, encoding="unic")
    
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
    img = Image.new('RGBA', size=(1, 1))
    draw = ImageDraw.Draw(img)

    size = (0,0)
    userSize = (0,0)
    titleSize = draw.textsize("{} Results".format(contest.name), font=headerFont)
    voterSize = draw.textsize("Now Voting: {} ({}/{})".format(contest.voters[currentVoterNumber], currentVoterNumber+1, contest.numVoters), font=voterHeaderFont)
    for entry in sortedData:
        entryTmp = draw.textsize("{} - {}".format(entry['artist'].upper(), entry['song'].upper()), font=songFont)
        if displayCountries:
            userTmp = draw.textsize(entry['country'].upper(), font=countryFont)
        else:
            userTmp = draw.textsize(entry['user'].upper(), font=countryFont)

        if entryTmp[0] >= size[0]:
            size = entryTmp

        if userTmp[0] >= userSize[0]:
            userSize = userTmp

    rectWidth = max(size[0], userSize[0]) + 80*scale + flagOffset
    width =  max(max((10*scale + (rectWidth) + 10*scale + (rectWidth) + 10*scale), (24*scale + titleSize[0] + 24*scale)), (5*scale + voterSize[0] + 5*scale))
    height = scale*(90 + 30*(int(contest.numEntries/2) + contest.numEntries%2) + 20)

    # Now, let's start with the actual scoreboard
    img = Image.new('RGBA', size=(width, height))
    draw = ImageDraw.Draw(img)

    # Background rectangle for image
    draw.rectangle(((0, 0), (width, height)), fill=lightGrey)

    # Voting Top Bar
    draw.rectangle(((0, 0), (width, 21*scale)), fill=colorDark)
    draw.text((5*scale, 3*scale), "Now Voting: {} ({}/{})".format(contest.voters[currentVoterNumber], currentVoterNumber+1, contest.numVoters), font=voterHeaderFont, fill=textWhite)
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
                category = flags[entry['country']]['category']
                countryISO =  flags[entry['country']]['alpha-2']
                flag = Image.open('Resources/Flags/{}/{}.png'.format(category, countryISO), 'r')
                fWidth, fHeight = flag.size
                if fWidth < fHeight:
                    flag = flag.resize((int((float(width)/height)*20*scale), 20*scale), Image.ANTIALIAS)
                elif fWidth == fHeight:
                    flag = flag.resize((20*scale, 20*scale), Image.ANTIALIAS)
                else:
                    flag = flag.resize((20*scale, int((float(height)/width)*20*scale)), Image.ANTIALIAS) 
                flag = ImageOps.expand(flag, border=1, fill=textGreyMain)                   
                img.paste(flag, (int(20*scale + 10*scale - flag.width/2.0) + xOffset, int(95*scale +10*scale - flag.height/2.0 + 30*yOffset*scale)))
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
        draw.rectangle(((xOffset+20*scale+flagOffset+max(size[0],userSize[0])+10*scale, 95*scale+30*scale*yOffset), (xOffset+20*scale+flagOffset+max(size[0],userSize[0])+10*scale+27*scale, 95*scale+30*scale*yOffset+20*scale)), fill=colorDark)
        totalSize = draw.textsize("{}".format(entry['display']), font=totalFont)
        draw.text((20*scale+xOffset+flagOffset+max(size[0],userSize[0])+10*scale+(27/2)*scale-(totalSize[0]/2.0), 97.5*scale+30*scale*yOffset), "{}".format(entry['display']), font=totalFont, fill=textWhite)                # dwg.add(dwg.text(insert=(267.5+xOffset,109.5+30*yOffset), text="{}".format(entry['display']), style="text-anchor: middle; font-size:14px; font-weight:700; font-family:'{}'; fill:{}; fill-opacity:1.00;".format(font, textWhite)))

        # Display the points awarded to the entry by the current voter
        if entry['data'][currentVoterNumber] != 0 and entry['data'][currentVoterNumber] != '':
            draw.rectangle(((xOffset+20*scale+flagOffset+max(size[0],userSize[0])+10*scale+27*scale, 95*scale+30*scale*yOffset), (xOffset+20*scale+flagOffset+max(size[0],userSize[0])+10*scale+27*scale+23*scale, 95*scale+30*scale*yOffset+20*scale)), fill=color)
            ptsSize = draw.textsize("{}".format(entry['data'][currentVoterNumber].upper(), font=pointsFont))
            draw.text((20*scale+xOffset+flagOffset+max(size[0],userSize[0])+10*scale+27*scale+(22/2.0)*scale-(ptsSize[0]/2.0)*scale, 97.5*scale+30*scale*yOffset), "{}".format(entry['data'][currentVoterNumber].upper()), font=pointsFont, fill=textWhite)        

        # Draw a dividing line between entries 
        if currentEntry+1 != leftHalf and currentEntry+1 != (contest.numEntries):
            draw.line((10*scale+xOffset, 120*scale+30*scale*yOffset, 10*scale+rectWidth+xOffset, 120*scale+30*scale*yOffset), fill=textGreyMain, width=1)

    img = img.resize((int(width/2), int(height/2)), Image.ANTIALIAS)
    img.save('{}/{} - {}.png'.format('Output', currentVoterNumber+1, safeVoterName))

# Generates a scoreboard image inspired by Wikipedia tables
def generateScoreboardWiki(contest, sortedData, currentVoterNumber, displayFlags=True, displayCountries=True):
    prepareOutputDirectory()
    flags = isoToCountry()
    safeVoterName = safeFileName(contest.voters[currentVoterNumber])    
    scale = 3
    
    # Fonts
    font = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Regular.ttf", 11*scale, encoding="unic")
    bold_font = ImageFont.truetype("Resources/Fonts/RobotoCondensed-Bold.ttf", 11*scale, encoding="unic")
    
    # Colors
    black = (33, 33, 33)
    light_blue = (29, 85, 176)
    dark_blue = (11, 9, 126)
    light_grey = (249, 249, 249)
    dark_grey = (242, 242, 242)
    border_grey = (172, 172, 172)

    # If we are going to display flags, the text should be offset by 24 pixels to accomodate the flags
    flagOffset = 0
    if displayFlags:
        flagOffset = 23*scale + 4*scale

    # We base the size of the image from the length of the longest entry or voter (which ever one is bigger)
    img = Image.new('RGBA', size=(1, 1))
    draw = ImageDraw.Draw(img)

    size = (0,0)
    userSize = (0,0)

    user_size = (0,0)
    artist_size = (0,0)
    song_size = (0,0)

    # titleSize = draw.textsize("{} Results".format(contest.name), font=headerFont)
    # voterSize = draw.textsize("Now Voting: {} ({}/{})".format(contest.voters[currentVoterNumber], currentVoterNumber+1, contest.numVoters), font=voterHeaderFont)
    for entry in sortedData:
        artistTmp = draw.textsize(entry['artist'], font=font)
        songTmp = draw.textsize(entry['song'], font=font)
        if displayCountries:
            userTmp = draw.textsize(entry['country'], font=font)
        else:
            userTmp = draw.textsize(entry['user'], font=font)

        if userTmp[0] >= user_size[0]:
            user_size = userTmp
        if artistTmp[0] >= artist_size[0]:
            artist_size = artistTmp
        if songTmp[0] >= song_size[0]:
            song_size = songTmp



    rectWidth = scale*8 + flagOffset + user_size[0] + scale*8 + artist_size[0] + scale*8 + song_size[0] + scale*50 + scale*50 + scale*50
    width = rectWidth*2
    height = scale*(24*2 + 24*(int(contest.numEntries/2) + contest.numEntries%2))
    # height = scale*(24 + 24*(int(contest.numEntries/2) + contest.numEntries%2) + 20)

    # Now, let's start with the actual scoreboard
    img = Image.new('RGBA', size=(width, height))
    draw = ImageDraw.Draw(img)

    # Background rectangle for image
    # draw.rectangle(((0, 0), (width, height)), fill=light_grey)

    # Voting Top Bar
    # draw.rectangle(((0, 0), (width, 21*scale)), fill=colorDark)
    # draw.text((5*scale, 3*scale), "Now Voting: {} ({}/{})".format(contest.voters[currentVoterNumber], currentVoterNumber+1, contest.numVoters), font=voterHeaderFont, fill=textWhite)
    # Contest Name Top Bar
    # draw.rectangle(((0, 20*scale), (width, 65*scale)), fill=color)
    # draw.text((24*scale, 31*scale), "{} Results".format(contest.name), font=headerFont, fill=textWhite)
 
    # How many entries should be in the left column of the scoreboard
    leftHalf = int(contest.numEntries/2) + contest.numEntries%2

    for currentEntry in range(contest.numEntries):
        if currentEntry < leftHalf:
            xOffset = 0
            yOffset = currentEntry + 2
        else:
            xOffset = rectWidth
            yOffset = currentEntry - leftHalf + 2

        entry = sortedData[currentEntry]
        # Place
        draw.rectangle(((xOffset, scale*23*yOffset), (xOffset+scale*50, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)
        # Country
        draw.rectangle(((xOffset+scale*50, scale*23*yOffset), (xOffset+scale*50+user_size[0]+flagOffset+scale*8, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)
        draw.rectangle(((xOffset+scale*50+user_size[0]+flagOffset+scale*8, scale*23*yOffset), (xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)
        draw.rectangle(((xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8, scale*23*yOffset), (xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8+song_size[0]+scale*8, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)
        draw.rectangle(((xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8+song_size[0]+scale*8, scale*23*yOffset), (xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8+song_size[0]+scale*8+scale*50, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)
        draw.rectangle(((xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8+song_size[0]+scale*8+scale*50, scale*23*yOffset), (xOffset+scale*50+user_size[0]+flagOffset+scale*8+artist_size[0]+scale*8+song_size[0]+scale*8+scale*50+scale*50, scale*23*(yOffset+1))), fill=light_grey, outline=border_grey)

        # Display the entry's country's flag (if displayFlags == True)
        if displayFlags:
            try:
                category = flags[entry['country']]['category']
                countryISO =  flags[entry['country']]['alpha-2']
                flag = Image.open('Resources/Flags/{}/{}.png'.format(category, countryISO), 'r')
                flag = flag.resize((23*scale, 15*scale), Image.ANTIALIAS) 
                flag = ImageOps.expand(flag, border=1, fill=border_grey)                   
                img.paste(flag, (xOffset+scale*50+scale*4, scale*23*yOffset+scale*4))
            except IndexError:
                countryISO = ""
                print("Flag not found for: {}".format(entry['country']))
            except KeyError:
                countryISO = ""
                print("Flag not found for: {}".format(entry['country']))

        place_size = draw.textsize("{}{}".format(currentEntry+1, appendInt(currentEntry+1)), font=bold_font)
        draw.text((xOffset+scale*25-place_size[0]/2, 23*scale*yOffset+scale*5), "{}{}".format(currentEntry+1, appendInt(currentEntry+1)), font=bold_font, fill=light_blue)

        # Display either the entry's country or user
        if displayCountries:
            countryString = entry['country']
        else:
            countryString = entry['user']
        draw.text((xOffset+scale*50+scale*4+flagOffset, 23*scale*yOffset+scale*5), countryString, font=font, fill=light_blue)

        # Display the entry's artist and song title
        draw.text((xOffset+scale*50+scale*4+flagOffset+user_size[0]+scale*4+scale*4, 23*scale*yOffset+scale*5), entry['artist'], font=font, fill=black)
        draw.text((xOffset+scale*50+scale*4+flagOffset+user_size[0]+scale*4+scale*4+artist_size[0]+scale*8, 23*scale*yOffset+scale*5), entry['song'], font=font, fill=black)
 
        # Display the total points the entry currently has
        totalSize = draw.textsize("{}".format(entry['display']), font=font)
        draw.text((xOffset+scale*50+scale*4+flagOffset+user_size[0]+scale*8+artist_size[0]+scale*8+song_size[0]+scale*4+scale*25-totalSize[0]/2, 23*scale*yOffset+scale*5), "{}".format(entry['display']), font=font, fill=black)

        # draw.text((20*scale+xOffset+flagOffset+max(size[0],userSize[0])+10*scale+(27/2)*scale-(totalSize[0]/2.0), 97.5*scale+30*scale*yOffset), "{}".format(entry['display']), font=totalFont, fill=textWhite)                # dwg.add(dwg.text(insert=(267.5+xOffset,109.5+30*yOffset), text="{}".format(entry['display']), style="text-anchor: middle; font-size:14px; font-weight:700; font-family:'{}'; fill:{}; fill-opacity:1.00;".format(font, textWhite)))

        # Display the points awarded to the entry by the current voter
        if entry['data'][currentVoterNumber] != 0 and entry['data'][currentVoterNumber] != '':
            ptsSize = draw.textsize("{}".format(entry['data'][currentVoterNumber].upper()), font=bold_font)
            draw.text((xOffset+scale*50+scale*4+flagOffset+user_size[0]+scale*8+artist_size[0]+scale*8+song_size[0]+scale*4+scale*50+scale*25-ptsSize[0]/2, 23*scale*yOffset+scale*5), "{}".format(entry['data'][currentVoterNumber].upper()), font=bold_font, fill=black)

    img.save('{}/{} - {}.png'.format('Output', currentVoterNumber+1, safeVoterName))

