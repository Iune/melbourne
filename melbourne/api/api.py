import logging
import os
from concurrent.futures import ThreadPoolExecutor
from tempfile import TemporaryDirectory

from PySide6.QtGui import QFontDatabase, QGuiApplication
from fastapi import FastAPI, Form, UploadFile

from melbourne.api.utilities import validate_flags, zip_scoreboards
from melbourne.contest.contest import load_contest_from_file
from melbourne.scoreboard.generator import Scoreboard
from melbourne.scoreboard.utilities import ScoreboardDetails, DEFAULT_MAIN_COLOR, DEFAULT_ACCENT_COLOR

logger = logging.getLogger(__name__)
app = FastAPI()

WORKING_DIR = "/Users/aditya/Development/contests/melbourne-api/tmp"
FONTS_DIR = "/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/fonts"
FLAGS_DIR = "/Users/aditya/Development/contests/melbourne-api/src/main/resources/base/flags"
MAX_WORKERS = 4


@app.on_event("startup")
async def startup_event():
    QGuiApplication()
    QFontDatabase.addApplicationFont(os.path.join(FONTS_DIR, "FiraSans-Medium.otf"))
    QFontDatabase.addApplicationFont(os.path.join(FONTS_DIR, "FiraSans-Regular.otf"))
    QFontDatabase.addApplicationFont(os.path.join(FONTS_DIR, "ZillaSlab-Regular.otf"))


@app.post("/api/scoreboards")
async def generate_scoreboards(contest_file: UploadFile, title: str = Form(), display_flags: bool = Form(False),
                               display_flag_borders: bool = Form(False), main_color: str = Form(DEFAULT_MAIN_COLOR),
                               accent_color: str = Form(DEFAULT_ACCENT_COLOR)):
    contest = load_contest_from_file(contest_file.file.read())

    with TemporaryDirectory(dir=WORKING_DIR) as temp_dir:
        details = ScoreboardDetails(
            contest=contest,
            output_dir=temp_dir,
            title=title,
            display_flags=display_flags,
            display_flag_borders=display_flag_borders,
            flags_dir=FLAGS_DIR,
            main_color=main_color,
            accent_color=accent_color,
        )
        generator = Scoreboard(details)

        # TODO: Add support for custom flags, and error handling

        # Validate flags
        if display_flags:
            are_flags_valid, invalid_flags = validate_flags(contest, FLAGS_DIR, None)
            if not are_flags_valid:
                # TODO: Error for invalid/missing flags
                return {}

        futures = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as e:
            for voter_num, voter in enumerate(contest.voters):
                # TODO: Handle errors in scoreboard generation
                futures.append(e.submit(generator.generate, voter_num))

        images = [f.result() for f in futures]
        zip_file = zip_scoreboards(images, temp_dir)
        # TODO: Handle errors if zipping fails
        # TODO: Upload zip file to storage location and get path
        # TODO: Figure out how to do this locally

    return zip_file
