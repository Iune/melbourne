from dataclasses import dataclass, field
from functools import cache
from math import ceil
from pathlib import Path

from skia import Color, ColorGetB, ColorGetG, ColorGetR, Font, Typeface

from melbourne.contest.contest import Contest
from melbourne.graphics.utilities import get_text_width_height, hex_to_rgb

_DEFAULT_IMAGE_SCALING_RATIO = 2.5

DEFAULT_MAIN_COLOR = "#2F292B"
DEFAULT_ACCENT_COLOR = "#FCB906"


@dataclass(frozen=True)
class ScoreboardFontsConfig:
    base_font_path: Path
    pts_font_path: Path


@dataclass
class ScoreboardFonts:
    config: ScoreboardFontsConfig

    voter_header: Font = field(init=False)
    contest_header: Font = field(init=False)
    country: Font = field(init=False)
    entry_details: Font = field(init=False)
    total_pts: Font = field(init=False)
    received_pts: Font = field(init=False)

    def __post_init__(self) -> None:
        if not self.config.base_font_path.exists():
            raise FileNotFoundError(f"Could not find {self.config.base_font_path=}")
        if not self.config.pts_font_path.exists():
            raise FileNotFoundError(f"Could not find {self.config.pts_font_path=}")
        base_typeface = Typeface.MakeFromFile(str(self.config.base_font_path))
        pts_typeface = Typeface.MakeFromFile(str(self.config.pts_font_path))

        self.voter_header = Font(base_typeface, 14 * _DEFAULT_IMAGE_SCALING_RATIO)
        self.contest_header = Font(base_typeface, 14 * _DEFAULT_IMAGE_SCALING_RATIO)
        self.country = Font(base_typeface, 12 * _DEFAULT_IMAGE_SCALING_RATIO)
        self.entry_details = Font(base_typeface, 12 * _DEFAULT_IMAGE_SCALING_RATIO)
        self.total_pts = Font(pts_typeface, 14 * _DEFAULT_IMAGE_SCALING_RATIO)
        self.received_pts = Font(pts_typeface, 14 * _DEFAULT_IMAGE_SCALING_RATIO)


@dataclass
class ScoreboardConfig:
    contest: Contest
    flags_dir: Path
    output_dir: Path
    title: str
    fonts_config: ScoreboardFontsConfig

    custom_flags_dir: Path | None = None
    display_flags: bool = True
    display_flag_borders: bool = True
    append_results_to_title: bool = True
    main_color: str = DEFAULT_MAIN_COLOR
    accent_color: str = DEFAULT_ACCENT_COLOR


@dataclass
class ScoreboardSizes:
    fonts: ScoreboardFonts
    config: ScoreboardConfig
    voter_idx: int
    scaling_ratio: float = _DEFAULT_IMAGE_SCALING_RATIO

    width: float = field(init=False)
    height: float = field(init=False)
    rectangle: float = field(init=False)
    flag_offset: float = field(init=False)
    entry_details: float = field(init=False)

    def __post_init__(self) -> None:
        voter_header_width, _ = get_text_width_height(
            self.fonts.voter_header,
            f"Now Voting: {self.config.contest.voter_names[self.voter_idx]} ({self.voter_idx + 1}/{self.config.contest.num_voters})",
        )
        contest_header_width, _ = get_text_width_height(
            self.fonts.contest_header,
            f"{self.config.title} Results"
            if self.config.append_results_to_title
            else self.config.title,
        )

        max_country_width = max(
            [
                get_text_width_height(self.fonts.country, entry.country)[0]
                for entry in self.config.contest.entries
            ]
        )
        max_entry_width = max(
            [
                get_text_width_height(
                    self.fonts.entry_details, f"{entry.artist} – {entry.song}"
                )[0]
                for entry in self.config.contest.entries
            ]
        )
        self.entry_details = max_entry_width

        self.flag_offset = (
            24.0 * self.scaling_ratio if self.config.display_flags else 0.0
        )
        self.rectangle = (
            max(max_country_width, max_entry_width)
            + self.flag_offset
            + 80.0 * self.scaling_ratio
        )

        self.width = ceil(
            max(
                max(
                    30.0 * self.scaling_ratio + 2 * self.rectangle,
                    48.0 * self.scaling_ratio + contest_header_width,
                ),
                10.0 * self.scaling_ratio + voter_header_width,
            )
        )

        num_entries_in_left_column = (
            int(self.config.contest.num_entries / 2)
            + self.config.contest.num_entries % 2
        )
        self.height = ceil(
            10.0 * self.scaling_ratio
            + 35.0 * self.scaling_ratio * num_entries_in_left_column
            + 70.0 * self.scaling_ratio
        )


@dataclass
class ScoreboardColors:
    main_color_hex: str
    accent_color_hex: str

    background: Color = field(init=False)
    voter_header: Color = field(init=False)
    voter_header_text: Color = field(init=False)
    contest_header: Color = field(init=False)
    contest_header_text: Color = field(init=False)

    flag: Color = field(init=False)
    flag_border: Color = field(init=False)

    entry_details: Color = field(init=False)
    entry_details_border: Color = field(init=False)
    entry_details_text: Color = field(init=False)
    country_text: Color = field(init=False)

    total_pts: Color = field(init=False)
    total_pts_text: Color = field(init=False)
    dqed_pts: Color = field(init=False)
    dqed_pts_text: Color = field(init=False)
    received_pts: Color = field(init=False)
    received_pts_text: Color = field(init=False)

    divider_line: Color = field(init=False)

    def __post_init__(self):
        main_color = hex_to_rgb(self.main_color_hex)
        accent_color = hex_to_rgb(self.accent_color_hex)

        main_luminance = (
            ColorGetR(main_color) * 0.299
            + ColorGetG(main_color) * 0.587
            + ColorGetB(main_color) * 0.114
        ) / 255.0
        main_text_color = (
            hex_to_rgb("#212121") if main_luminance > 0.5 else hex_to_rgb("#FFFFFF")
        )
        accent_luminance = (
            ColorGetR(accent_color) * 0.299
            + ColorGetG(accent_color) * 0.587
            + ColorGetB(accent_color) * 0.114
        ) / 255.0
        accent_text_color = (
            hex_to_rgb("#212121") if accent_luminance > 0.5 else hex_to_rgb("#FFFFFF")
        )

        self.background = hex_to_rgb("#EEEEEE")
        self.voter_header = main_color
        self.voter_header_text = main_text_color
        self.contest_header = accent_color
        self.contest_header_text = accent_text_color

        self.flag = hex_to_rgb("#FAFAFA")
        self.flag_border = hex_to_rgb("#C4C4C4")

        self.entry_details = hex_to_rgb("#FAFAFA")
        self.entry_details_border = hex_to_rgb("#C4C4C4")
        self.country_text = hex_to_rgb("#7E7E7E")
        self.entry_details_text = hex_to_rgb("#212121")

        self.total_pts = main_color
        self.total_pts_text = main_text_color
        self.received_pts = accent_color
        self.received_pts_text = accent_text_color
        self.dqed_pts = hex_to_rgb("#C4C4C4")
        self.dqed_pts_text = hex_to_rgb("#212121")

        self.divider_line = hex_to_rgb("#C4C4C4")


@cache
def load_fonts(config: ScoreboardFontsConfig) -> ScoreboardFonts:
    """Load fonts used for scoreboard generation. Here, we can use the functools.cache() decorator as this remains constant for the entire run of the program."""
    return ScoreboardFonts(config)
