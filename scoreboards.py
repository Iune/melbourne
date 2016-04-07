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
def generateScoreboardMaterial(contest, sortedData, currentVoter, color="#009688", colorDark="#2f292b", displayFlags=True, displayCountries=False):
    

