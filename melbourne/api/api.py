import logging
import os
from tempfile import TemporaryDirectory

from PySide6.QtGui import QFontDatabase, QGuiApplication
from fastapi import FastAPI, File

from melbourne.contest.contest import load_contest_from_file
from melbourne.scoreboard.generator import Scoreboard
from melbourne.scoreboard.utilities import ScoreboardDetails

logger = logging.getLogger(__name__)
app = FastAPI()

WORKING_DIR = "/Users/aditya/Development/contests/melbourne-api/tmp"
FLAGS_DIR = "/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/flags"

@app.on_event("startup")
async def startup_event():
    QGuiApplication()
    QFontDatabase.addApplicationFont(os.path.join("/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/fonts", "FiraSans-Medium.otf"))
    QFontDatabase.addApplicationFont(os.path.join("/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/fonts", "FiraSans-Regular.otf"))
    QFontDatabase.addApplicationFont(os.path.join("/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/fonts", "ZillaSlab-Regular.otf"))


@app.post("/api/contest")
def load_contest(contest_file: bytes = File()):
    contest = load_contest_from_file(contest_file)

    images = []
    # temp_dir = TemporaryDirectory(dir=WORKING_DIR)
    details = ScoreboardDetails(
        contest=contest,
        output_dir=WORKING_DIR,
        flags_dir=FLAGS_DIR,
        title="Title",
        display_flags=True,
        display_flag_borders=True,
    )

    # TODO Threading
    generator = Scoreboard(details)
    for voter_num, voter in enumerate(contest.voters):
        images.append(generator.generate(voter_num))

    return images

    # ScoreboardDetails(
    #     contest=self.contest,
    #     output_dir=self.output_folder_le.text(),
    #     title=self.scoreboard_title_le.text(),
    #     main_color=self.main_color_le.text(),
    #     accent_color=self.accent_color_le.text(),
    #     display_flags=self.display_flags_check.isChecked(),
    #     display_flag_borders=self.display_flags_check.isChecked() and self.flag_borders_check.isChecked(),
    #     windows_dpi_scaling=dpi_scaling_factor
    # ))


@app.post("/api/flags/validate")
def validate_flags():
    pass


@app.post("/api/scoreboards")
def generate_scoreboards():
    pass
