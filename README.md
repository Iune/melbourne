# About
`Melbourne` is a PNG scoreboard generator that takes in an input file containing information about participants and voters and generates good-looking scoreboards with the results after each voter.

What this means is that contest hosts need not worry about spending hours on making scoreboards near the results deadline if they do not want to — `Melbourne` takes care of this for them. 

# Installation
## Python 3
`Melbourne` is written in **Python 3.5** and consequently needs Python to be installed on users' systems before it can work.

Installation on Windows and OSX is relatively simple; just navigate to [the official website](https://www.python.org/downloads/), and download and install the appropriate version of Python 3 for your operating system. 

As long as you install Python 3 (and not Python 2), you should be fine. The latest version as of 7 April 2016 was Python 3.5.1.

### OSX
Apple distributes OSX with a version of Python already installed. Unfortunately, this version is from the older Python 2.7.x release which is *not* compatible with `Melbourne`; you will still need to install Python 3.

As a result, you will need to change all instances of `python` and `pip` in the steps below to `python3` and `pip3` to make sure you run the Python 3 version of these programs. 


### Windows
When installing, make sure to select the option to add Python to the `Path` as this will allow you to run Python in the command line without using the full path to the Python install.

## Required Python Libraries
`Melbourne` requires the install of two additional libraries, the `Python Imaging Library (PIL)` and `unidecode` to run.

> **Note:** Instead of the original `PIL` library, which is no longer developed, we will be installing a modern, up-to-date fork called `Pillow`.

To install these libraries, we will use a tool called `pip` (`pip3` on OSX) which will automatically download these libraries and install them to the proper location.

Open up the command line and type in the command to install these libraries. 

	pip install Pillow unidecode
	
`pip` will download and install the two libraries and voilà! You have installed all the prequisites for `Melbourne`. Now let's get to actually downloading the program and using it.

## Melbourne
Download and extract the zip file containing `Melbourne` to a convenient location on your hard drive. I personally use the home folder of my user account (as that is easy to access from the command line) but it's really personal preference and doesn't really affect the usage of the program.

# Using `Melbourne`
## Quick Command Line Intro
### OSX and Linux
To access the command line on OSX, we use an application called `Terminal` (as an aside, the "terminal" is a synonym for the command line).

On Linux, the name for the terminal application is dependent on your distribution and desktop environment. Chances are, running a Linux distribution means that you probably already know the name of this program.

OSX and Linux share a common ancestry, and as a result they largely use the same basic tools for navigating and using the command line, which is why I've lumped them together in this category.

To list all the files and folders (also known as directories) in a directory, we use `ls`.

	$ ls
	Desktop		Downloads	Movies		Pictures	Public
	Documents	Library		Music		Programming	VirtualBox VMs

To navigate into another folder (let's say I want to go to my `Desktop` folder, we use `cd`.

	$ cd Desktop
	
> **Note:** In the command line, if you want to autocomplete the name of folders and files, type `Tab` - the system will try to autocomplete the name of the file/directory based on what you've typed so far.

If I want to go back to the directory above, type:

	$ cd ..
	
### Windows

On versions of Windows prior to Windows 7, the only way to access the command line was through an application known as `Command Prompt`. However, beginning with Windows 7, Microsoft has also shipped an application called `Windows Powershell`, which is a much more powerful (and in my opinion, better) way to access the command line on Windows than `Command Prompt`.

There are some differences between Windows and OSX/Linux to keep in mind when accessing the command line.

1. On OSX and Linux, directories are denoted with the forward slash `/` whereas on Windows, they are denoted with the backslash `\`.
2. Windows uses `dir` instead of `ls` to list the files and directories in a given folder. 

> **Note:** `Powershell` comes with `ls` in addition to `dir`.


## Formatting the Input File
`Melbourne` reads in input from files in the CSV format. While you can create these files manually, I reccomend creating them (in the proper format) in a spreadsheet application such as `Excel`, `Google Docs`, or `LibreOffice Calc` first and then copying them over into a CSV file.

### Entry Formatting
`Melbourne` requires the first six columns of the data file to be in a particular format (*always* in the same order and *always* present, even if some columns are empty).

\#  | User | Country | Artist | Song | Total
--- | --- | --- | --- | --- | --- |
Entry Placing  | Username | Artist's country of origin | Artist's name | Song title | Entry's total points

> **Note:** `Melbourne` ignores the values in the `#` and `Total` columns when generating the scoreboards; it adds up the votes on the fly. These columns are present more for user convenience (although they're still required).
> 
> **Note:** The `Artist` column is used to display flags if that option is enabled — country name formats can be seen in `Resources/countries.json`.

### Voter Formatting
The votes are placed in the file after the six columns for the entry data; each voter comes in a separate column afterwards.

Place the voter name in the first cell (the header cell) of the column, and the votes in the remaining cells, with the points awarded by the voter to an entry in that entry's rows.

If you wish to disqualify an entry (for example, if the voter didn't vote) place `DQ` in that entry's row in the voter column. 

For example, if `Voter 3` didn't vote and their entry was `Entry 3` and we wish to disqualify them, it would look like something this:

\#  | User | Country | Artist | Song | Total | Voter 1 | Voter 2 | Voter 3
--- | --- | --- | --- | --- | --- | --- | --- | --- |
1 | User 1 | Country 1 | Artist 1 | Song 1 | 8 |  | 8 |
2 | User 2 | Country 2 | Artist 2 | Song 2 | 20 | 10 | 10 |
3 | User 3 | Country 3 | Artist 3 | Song 3 | 12 |  | 12 | DQ
4 | User 4 | Country 4 | Artist 4 | Song 4 | 12 | 12 |  |
5 | User 5 | Country 5 | Artist 5 | Song 5 | 8 | 8 |  |
5 | User 5 | Country 5 | Artist 5 | Song 5 | 0 |  |  |

### Copying Spreadsheet Data to CSV File
Now that we have our data for the contest properly formatted in the spreadsheet, let's transfer it to a CSV file. 

Simply copy all of the cells with our data in it, and paste it into a plain-text editor, such as `Notepad` on Windows or `TextEdit` on OSX. Save the file with a `.csv` extension, such as `myfile.csv`, in the same folder as `melbourne.py`.

> **Note:** If you have special characters in the file (such as accented characters `á`, etc.) *make sure to save the file with UTF-8 encoding*.
> 
> **Note:** Technically, spreadsheet applications such as `Excel` *can* save spreadsheets as CSV files by themselves (without you copying from them and saving into a plain-text editor manually). However, I do not reccomend doing so as encoding issues (with special characters) may occur.

## Running `Melbourne`
To run, navigate to the folder containing `melbourne.py` (the actual application) and the input CSV file you copied here in the previous step.

To run `Melbourne` type the following into the command line:

	python melbourne.py input_file.csv "Contest Name" *options go here*

> **Note:** Don't forget that in OSX, we will need to use `python3` instead of `python`.
> 
> **Note:** If the input file or the contest name have any spaces in them, you will need to enclose them in quotes. 
> 
> > `python melbourne.py "Input File.csv" "Contest Name"`
>
> **Note:** `Melbourne` automatically appends "Results" to the end of the contest name, you do not need to include this in `Contest Name`. 

### Flags
Flags are kind of like on-off switches — they indicate whether an option should or should not be done. 

Each flag has a letter associated with it; to toggle the flag just type `-X` where `X` is the associated letter and `-` is a single dash.

`Melbourne` has two flags:

| Flag | Letter | Description |
| --- | --- | --- |
| Display flags | `-f` | Display flags in the scoreboards |
| Display countries or usernames | `-c` | Display an artist's country of origin above the artist name and song title instead of the associated username.

> **Note:** An absence of the flags listed above means that those actions will not be performed — flags will not be shown in the scoreboards, and the entry username will be displayed above the artist and song title.

An example of a command with flags toggled can be seen below. The second line is an example of how to combine flags (for a less verbose input).

	python melbourne.py input.csv "Contest Name" -f -c *or*
	python melbourne.py input.csv "Contest Name" -fc 

### Other Options
But what happens if you want to change the colors in the scoreboard? Flags are useful for toggling settings, but we want to input a value as well.

To input options with values, we use options with double dashes (`--`), followed by the value we wish to input (enclosed in double quotes).

| Option | Input | Description |
| --- | --- | --- |
| Color | `--color "#XXXXXX"` | Use the specified accent color (by default a teal-like green) |
| Color Dark | `--colorDark "#XXXXXX"` | Use the specified color as the main color in the scoreboards (by default a black) |

> **Note:** The input colors for `color` and `colorDark` must be in HEX format.

Putting it all together, let's say that we wanted to change the accent color from green to a dark red (`Hex: #B71C1C`) and display the country flags as well. We would type:

	python melbourne.py input.csv "Contest Name" -f --color "#B71C1C"