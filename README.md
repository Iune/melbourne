# Background
`Melbourne` is a program which takes in an input file and generates output images based on this file. The program, written in Python 3 is designed to allow users to quickly and easily create *good looking* scoreboards for online contests by simply providing an input file with information about the participants as well as the voters.

# Installation

## Install Python 3
`Melbourne` is written in Python 3, so you will need to have that installed on your system. Download and install the appropriate version from [the official website](https://www.python.org/downloads/). The exact version of Python 3 you install is not particularly relevant — the latest version as of 6 April 2016 is Python 3.5.1.

If you are installing Python 3 on Windows, don't forget to select the option to add Python to the `PATH` variable.

## Install Required Libraries
`Melbourne` requires the installation of one additional Python library before it can be used to generate scoreboards. This library is the `Python Imaging Library (PIL)` — more specifically, we will be using a fork of the library called `Pillow`.

To install, run the following command in the terminal:
	pip3 install Pillow

Note: Depending on your system, you might need administrative priviledges to run this command. You can get administrative priviledges by prefixing the above command with `sudo`.

For more information on installing `Pillow`, see [the official site](http://pillow.readthedocs.org/en/3.1.x/installation.html).
