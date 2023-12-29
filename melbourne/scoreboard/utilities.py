from dataclasses import dataclass, field
from typing import Optional

from PySide6.QtCore import QRectF, QSizeF, QRect, QPoint
from PySide6.QtGui import QFont, QColor, QFontMetrics, Qt, QPainter, QPen
from webcolors import hex_to_rgb

from melbourne.contest.contest import Contest

DEFAULT_IMAGE_SCALING = 2.5
DEFAULT_BASE_FONT_FAMILY = "Zilla Slab"
DEFAULT_POINTS_FONT_FAMILY = "Fira Sans"
DEFAULT_MAIN_COLOR = "#2F292B"
DEFAULT_ACCENT_COLOR = "#FCB906"


@dataclass
class ScoreboardDetails:
    contest: Contest
    output_dir: str
    flags_dir: str
    title: str
    display_flags: bool
    display_flag_borders: bool

    main_color: str = DEFAULT_MAIN_COLOR
    accent_color: str = DEFAULT_ACCENT_COLOR
    scaling: float = DEFAULT_IMAGE_SCALING
    base_font_family: str = DEFAULT_BASE_FONT_FAMILY
    pts_font_family: str = DEFAULT_POINTS_FONT_FAMILY

    custom_flags_dir: str = None  # TODO: Add support for custom flags


@dataclass
class ScoreboardFonts:
    base_font_family: str = DEFAULT_BASE_FONT_FAMILY
    pts_font_family: str = DEFAULT_POINTS_FONT_FAMILY
    scaling: float = DEFAULT_IMAGE_SCALING
    font_os_scaling: float = 1.0

    voter_header: QFont = field(init=False)
    contest_header: QFont = field(init=False)
    country: QFont = field(init=False)
    entry_details: QFont = field(init=False)
    awarded_pts: QFont = field(init=False)
    total_pts: QFont = field(init=False)

    def __post_init__(self):
        self.voter_header = QFont(
            self.base_font_family, int(14 * self.scaling * self.font_os_scaling)
        )
        self.contest_header = QFont(
            self.base_font_family, int(14 * self.scaling * self.font_os_scaling)
        )
        self.country = QFont(
            self.base_font_family, int(12 * self.scaling * self.font_os_scaling)
        )
        self.entry_details = QFont(
            self.base_font_family, int(12 * self.scaling * self.font_os_scaling)
        )
        self.awarded_pts = QFont(
            self.pts_font_family, int(14 * self.scaling * self.font_os_scaling)
        )
        self.total_pts = QFont(
            self.pts_font_family, int(14 * self.scaling * self.font_os_scaling)
        )


def _hex_to_rgb(hex_code: str) -> QColor:
    rgb = hex_to_rgb(hex_code)
    return QColor(rgb.red, rgb.green, rgb.blue)


@dataclass
class ScoreboardColors:
    main_color_hex: DEFAULT_MAIN_COLOR
    accent_color_hex: DEFAULT_ACCENT_COLOR

    light_grey: QColor = field(init=False)
    white: QColor = field(init=False)
    black: QColor = field(init=False)
    grey_text: QColor = field(init=False)
    white_text: QColor = field(init=False)
    country_text: QColor = field(init=False)

    main: QColor = field(init=False)
    accent: QColor = field(init=False)
    main_text: QColor = field(init=False)
    accent_text: QColor = field(init=False)

    def __post_init__(self):
        self.light_grey = _hex_to_rgb("#EEEEEE")
        self.white = _hex_to_rgb("#FAFAFA")
        self.black = _hex_to_rgb("#212121")
        self.grey_text = _hex_to_rgb("#C4C4C4")
        self.white_text = _hex_to_rgb("#FFFFFF")
        self.country_text = _hex_to_rgb("#7E7E7E")

        self.main = _hex_to_rgb(self.main_color_hex)
        self.accent = _hex_to_rgb(self.accent_color_hex)

        luminance = (
            self.main.red() * 0.299
            + self.main.green() * 0.587
            + self.main.blue() * 0.114
        ) / 255
        self.main_text = self.black if luminance > 0.5 else self.white_text

        luminance = (
            self.accent.red() * 0.299
            + self.accent.green() * 0.587
            + self.accent.blue() * 0.114
        ) / 255
        self.accent_text = self.black if luminance > 0.5 else self.white_text


@dataclass
class ScoreboardSizes:
    details: ScoreboardDetails
    fonts: ScoreboardFonts
    voter: int

    voter_header: float = field(init=False)
    contest_header: float = field(init=False)
    country: float = field(init=False)
    entry_details: float = field(init=False)
    flag_offset: float = field(init=False)
    rectangle: float = field(init=False)
    width: float = field(init=False)
    height: float = field(init=False)

    def __post_init__(self):
        contest = self.details.contest
        scaling = self.details.scaling

        self.voter_header = (
            QFontMetrics(self.fonts.voter_header)
            .boundingRect(
                f"Now Voting: {contest.voters[self.voter]} ({self.voter + 1}/{contest.num_voters}"
            )
            .width()
        )
        self.contest_header = (
            QFontMetrics(self.fonts.contest_header)
            .boundingRect(f"{self.details.title} Results")
            .width()
        )

        self.country = self.entry_details = 0.0
        country_fm = QFontMetrics(self.fonts.country)
        entry_fm = QFontMetrics(self.fonts.entry_details)
        for entry in contest.entries:
            current_country = country_fm.boundingRect(entry.country).width()
            current_entry = entry_fm.boundingRect(
                f"{entry.artist} – {entry.song}"
            ).width()

            if current_country > self.country:
                self.country = current_country
            if current_entry > self.entry_details:
                self.entry_details = current_entry

        self.flag_offset = 24 * scaling if self.details.display_flags else 0
        self.rectangle = (
            max(self.country, self.entry_details) + self.flag_offset + 80 * scaling
        )
        self.width = max(
            max(30 * scaling + 2 * self.rectangle, 48 * scaling + self.contest_header),
            10 * scaling + self.voter_header,
        )

        num_entries_in_left_col = int(contest.num_entries / 2) + contest.num_entries % 2
        self.height = (
            10.0 * scaling + 35 * scaling * num_entries_in_left_col + 70 * scaling
        )


def draw_text(
    painter,
    point: QPoint,
    text: str,
    font: QFont,
    color: QColor,
    flags: Qt.AlignmentFlag,
):
    painter.setPen(color)
    painter.setFont(font)
    _draw_text_helper(painter, point, text, flags | Qt.AlignVCenter)


def _draw_text_helper(
    painter: QPainter, point: QPoint, text: str, flags: Qt.AlignmentFlag
) -> None:
    # We want an arbitrarily large size, so that we don't have to worry about text being cut off
    size = 1000000.0
    new_x = point.x()
    new_y = point.y() - size

    if flags & Qt.AlignHCenter:
        new_x -= size / 2.0
    elif flags & Qt.AlignRight:
        new_x += size / 2.0
    if flags & Qt.AlignVCenter:
        new_y += size / 2.0
    elif flags & Qt.AlignTop:
        new_y += size
    else:
        flags |= Qt.AlignBottom

    rect = QRectF(QPoint(new_x, new_y), QSizeF(size, size))
    painter.drawText(rect, flags, text)


def draw_rectangle(
    painter: QPainter,
    point: QPoint,
    size: QPoint,
    fill: QColor,
    border: Optional[QColor] = None,
    border_width: int = 0,
) -> None:
    if border:
        painter.setBrush(fill)
        painter.setPen(QPen(border, border_width))
        painter.drawRect(QRect(point.x(), point.y(), size.x(), size.y()))
    else:
        painter.fillRect(QRect(point.x(), point.y(), size.x(), size.y()), fill)
