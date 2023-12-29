import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from tempfile import TemporaryDirectory
from functools import lru_cache

from PySide6.QtGui import QFontDatabase, QGuiApplication
from fastapi import FastAPI, Form, UploadFile, HTTPException
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

from melbourne.api.utilities import validate_flags, zip_scoreboards
from melbourne.contest.contest import load_contest_from_file
from melbourne.scoreboard.generator import Scoreboard
from melbourne.scoreboard.utilities import (
    ScoreboardDetails,
    DEFAULT_MAIN_COLOR,
    DEFAULT_ACCENT_COLOR,
)

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    working_dir: str
    fonts_dir: str
    flags_dir: str
    max_workers: int = 4

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
app = FastAPI()


@app.on_event("startup")
async def startup_event():
    QGuiApplication()
    QFontDatabase.addApplicationFont(
        os.path.join(settings.fonts_dir, "FiraSans-Medium.otf")
    )
    QFontDatabase.addApplicationFont(
        os.path.join(settings.fonts_dir, "FiraSans-Regular.otf")
    )
    QFontDatabase.addApplicationFont(
        os.path.join(settings.fonts_dir, "ZillaSlab-Regular.otf")
    )


class GenerateScoreboardsResponse(BaseModel):
    zip_file: str = ""
    error_msg: str = ""
    error_details: str | list[str] = None


@app.post("/api/scoreboards")
async def generate_scoreboards(
    contest_file: UploadFile,
    title: str = Form(),
    display_flags: bool = Form(False),
    display_flag_borders: bool = Form(False),
    main_color: str = Form(DEFAULT_MAIN_COLOR),
    accent_color: str = Form(DEFAULT_ACCENT_COLOR),
) -> GenerateScoreboardsResponse:
    contest = load_contest_from_file(contest_file.file.read())

    with TemporaryDirectory(dir=settings.working_dir) as temp_dir:
        details = ScoreboardDetails(
            contest=contest,
            output_dir=temp_dir,
            title=title,
            display_flags=display_flags,
            display_flag_borders=display_flag_borders,
            flags_dir=settings.flags_dir,
            main_color=main_color,
            accent_color=accent_color,
        )
        generator = Scoreboard(details)

        # TODO: Add support for custom flags, and error handling

        # Validate flags
        if display_flags:
            logger.info("Validating flags")
            are_flags_valid, invalid_flags = validate_flags(
                contest, settings.flags_dir, None
            )
            if not are_flags_valid:
                logger.error(f"Found invalid flags: {invalid_flags}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid flags found: {','.join(invalid_flags)}",
                )

        with ThreadPoolExecutor(max_workers=settings.max_workers) as e:
            futures = []
            for voter_num, voter in enumerate(contest.voters):
                futures.append(e.submit(generator.generate, voter_num))

            for future in as_completed(futures):
                try:
                    _ = future.result()
                except Exception as ex:
                    logger.error(ex)
                    raise HTTPException(
                        status_code=400, detail="Failed to generate scoreboards"
                    ) from ex

        images = [f.result() for f in futures]
        try:
            zip_file = zip_scoreboards(images, settings.working_dir)
        except Exception as ex:
            logger.error(ex)
            raise HTTPException(
                status_code=400, detail="Failed to zip up scoreboards"
            ) from ex

        # TODO: Upload zip file to storage location and get path
        # TODO: Figure out how to do this locally

    return GenerateScoreboardsResponse(success=True, zip_file=zip_file)
