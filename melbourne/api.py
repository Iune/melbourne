import logging
import uuid
from functools import cache
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import FastAPI, Form, HTTPException, Security, UploadFile, status
from fastapi.security import APIKeyHeader, HTTPBasic
from humanfriendly import Timer
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

from melbourne.contest.contest import get_contest_from_file
from melbourne.graphics.config import (
    DEFAULT_ACCENT_COLOR,
    DEFAULT_MAIN_COLOR,
    ScoreboardConfig,
    ScoreboardFontsConfig,
)
from melbourne.graphics.scoreboard import generate_contest_scoreboards

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    working_dir: Path
    flags_dir: Path
    base_font_path: Path
    pts_font_path: Path
    valid_api_key: str

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", env_ignore_empty=True
    )


@cache
def get_settings():
    return Settings()


settings = get_settings()
app = FastAPI()
security = HTTPBasic()
api_key = APIKeyHeader(name="melbourne-api-key", auto_error=False)


def zip_scoreboards(images: list[Path], output_dir: Path) -> str:
    zip_file_name = f"{uuid.uuid4().hex}.zip"
    zip_file_path = output_dir / zip_file_name
    with ZipFile(zip_file_path, mode="w", compression=ZIP_DEFLATED) as z:
        for img_file_path in images:
            z.write(img_file_path, img_file_path.name)
    return zip_file_name


class GenerateScoreboardsResponse(BaseModel):
    zip_file: str = ""
    error_msg: str = ""
    error_details: str | list[str] = None


@app.post("/api/scoreboards")
async def generate_scoreboards(
    contest_file: UploadFile,
    has_count_column: bool = Form(False),
    title: str = Form(),
    append_results_to_title: bool = Form(True),
    display_flags: bool = Form(False),
    display_flag_borders: bool = Form(False),
    main_color: str = Form(DEFAULT_MAIN_COLOR),
    accent_color: str = Form(DEFAULT_ACCENT_COLOR),
    api_key: str = Security(api_key),
) -> GenerateScoreboardsResponse:
    logger.debug("Handling generate_scoreboard request")
    if api_key is None:
        logger.error("Missing API Key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No API key was specified"
        )
    if api_key != settings.valid_api_key:
        logger.error("Invalid API Key value")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
        )

    contest = get_contest_from_file(contest_file.file.read(), has_count_column)
    logger.info("Parsed contest from file")

    with TemporaryDirectory(dir=settings.working_dir) as temp_dir:
        config = ScoreboardConfig(
            contest=contest,
            flags_dir=settings.flags_dir,
            # TODO: Support custom flags
            custom_flags_dir=None,
            output_dir=Path(temp_dir),
            fonts_config=ScoreboardFontsConfig(
                base_font_path=settings.base_font_path,
                pts_font_path=settings.pts_font_path,
            ),
            title=title,
            append_results_to_title=append_results_to_title,
            main_color=main_color,
            accent_color=accent_color,
            display_flags=display_flags,
            display_flag_borders=display_flag_borders,
        )

        # TODO: Validate flags

        # Generate scoreboards
        logger.info(f"Generating {contest.num_voters} scoreboards")
        scoreboards = []
        try:
            timer = Timer()
            scoreboards.extend(generate_contest_scoreboards(config))
            logger.info(f"Scoreboard generation took {timer.rounded}")
        except Exception as e:
            logger.exception(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate scoreboards",
            ) from e

        # Zip scoreboards
        try:
            zip_file_path = zip_scoreboards(scoreboards, Path(temp_dir))
        except Exception as e:
            logger.exception(e)
            raise HTTPException(
                status=status.HTTP_400_BAD_REQUEST, detail="Failed to zip scoreboards"
            ) from e

        # TODO: Upload zip file to storage

    return GenerateScoreboardsResponse(success=True, zip_file=str(zip_file_path))
