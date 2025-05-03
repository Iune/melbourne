import logging
import click
from pathlib import Path
from click_loglevel import LogLevel
from melbourne.contest.contest import get_contest_from_file

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
def main(input_file: Path, has_count_column: bool, log_level: int) -> None:
    setup_logging(log_level)
    contest = get_contest_from_file(input_file, has_count_column)
    contest.print_final_results()


if __name__ == "__main__":
    main()
