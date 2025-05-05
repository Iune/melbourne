import logging
import uuid
from functools import cache
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_BZIP2, ZipFile
import boto3
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
from contextlib import asynccontextmanager
from botocore.exceptions import ClientError
from botocore.client import Config

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    working_dir: Path
    flags_dir: Path
    base_font_path: Path
    pts_font_path: Path
    valid_api_key: str
    upload_zip_files: bool = False

    r2_account_id: str
    r2_endpoint_url: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket_name: str

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", env_ignore_empty=True
    )


@cache
def get_settings():
    return Settings()


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Instantiate S3 client
    app.state.s3_client = None
    if settings.upload_zip_files:
        app.state.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
        )
    yield


app = FastAPI(lifespan=lifespan)
security = HTTPBasic()
api_key = APIKeyHeader(name="melbourne-api-key", auto_error=False)


def zip_scoreboards(images: list[Path], output_dir: Path) -> Path:
    zip_file_name = f"{uuid.uuid4().hex}.zip"
    zip_file_path = output_dir / zip_file_name
    with ZipFile(zip_file_path, mode="w", compression=ZIP_BZIP2) as z:
        for img_file_path in images:
            z.write(img_file_path, img_file_path.name)
    return zip_file_path


def upload_zip_file(zip_file_path: Path) -> str:
    try:
        key = str(Path("scoreboards") / zip_file_path.name)
        app.state.s3_client.upload_file(zip_file_path, settings.r2_bucket_name, key)
    except ClientError as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to upload zip file",
        ) from e

    try:
        presigned_url = app.state.s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": key,
            },
            ExpiresIn=600,  # Expires in 10 minutes
        )
    except ClientError as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate zip file url",
        ) from e
    return presigned_url


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
        zip_file_dir = (
            Path(temp_dir) if settings.upload_zip_files else settings.working_dir
        )
        try:
            logger.debug("Creating zip file for scoreboards")
            zip_file_path = zip_scoreboards(scoreboards, zip_file_dir)
        except Exception as e:
            logger.exception(e)
            raise HTTPException(
                status=status.HTTP_400_BAD_REQUEST, detail="Failed to zip scoreboards"
            ) from e

        # Upload zip file to storage
        if settings.upload_zip_files:
            logger.info("Uploading zip file")
            zip_file = upload_zip_file(zip_file_path)
        else:
            zip_file = zip_file_path.name

    return GenerateScoreboardsResponse(success=True, zip_file=zip_file)
