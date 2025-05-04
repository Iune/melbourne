import logging
from pathlib import Path

import click
from click_loglevel import LogLevel

from melbourne.contest.contest import get_contest_from_file
from melbourne.graphics.config import ScoreboardConfig, ScoreboardFontsConfig
from melbourne.graphics.scoreboard import (
    generate_scoreboards,
)

logger = logging.getLogger(__name__)


def setup_logging(log_level: int) -> None:
    logging.basicConfig(
        format="[%(levelname)s] %(message)s",
        level=log_level,
    )


@click.command()
@click.option(
    "--input-file",
    "-i",
    type=click.Path(exists=True, dir_okay=False, path_type=Path),
    required=True,
    help="Path to Excel file with contest results",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    required=True,
    help="Directory to save generated scoreboards",
)
@click.option(
    "--has-count-column",
    "-c",
    is_flag=True,
    show_default=True,
    help="Whether the Excel file contains a 'Count' column after the 'Total' column",
)
@click.option(
    "-l",
    "--log-level",
    type=LogLevel(),
    default="INFO",
    show_default=True,
    help="Set logging level",
)
def main(
    input_file: Path, output_dir: Path, has_count_column: bool, log_level: int
) -> None:
    setup_logging(log_level)
    contest = get_contest_from_file(input_file, has_count_column)
    config = ScoreboardConfig(
        contest=contest,
        flags_dir=Path("assets/flags"),
        custom_flags_dir=Path("assets/custom"),
        output_dir=output_dir,
        title="Eurovision 1988",
        fonts_config=ScoreboardFontsConfig(
            base_font_path=Path("assets/fonts/ZillaSlab-Regular.otf"),
            pts_font_path=Path("assets/fonts/FiraSans-Regular.otf"),
        ),
        main_color="#0D47A1",
        accent_color="#1976D2",
    )

    generate_scoreboards(config)


if __name__ == "__main__":
    main()
