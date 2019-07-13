import fbs_runtime
import webcolors
from PySide2.QtGui import QColor, QFont, QFontMetrics

DEFAULT_ACCENT_COLOR = "#FCB906"
DEFAULT_SCALE = 2.5

DEFAULT_BASE_FONT_FAMILY = "Zilla Slab"
DEFAULT_POINTS_FONT_FAMILY = "Fira Sans"


class ScoreboardDetails:
    def __init__(self, contest, output_dir, title, accent_color, display_flags=True,
                 scale=DEFAULT_SCALE):
        self.contest = contest
        self.output_dir = output_dir

        self.title = title
        self.accent_color = accent_color
        self.display_flags = display_flags
        self.scale = scale


class ScoreboardFonts:
    def __init__(self, scale=DEFAULT_SCALE):
        if fbs_runtime.platform.is_windows():
            os_scale = 72/96
        else:
            os_scale = 1.0
        self.voter_header = QFont(DEFAULT_BASE_FONT_FAMILY, 14 * scale * os_scale)
        self.contest_header = QFont(DEFAULT_BASE_FONT_FAMILY, 14 * scale * os_scale)
        self.country = QFont(DEFAULT_BASE_FONT_FAMILY, 12 * scale * os_scale)
        self.entry_details = QFont(DEFAULT_BASE_FONT_FAMILY, 12 * scale * os_scale)
        self.awarded_pts = QFont(DEFAULT_POINTS_FONT_FAMILY, 14 * scale * os_scale)
        self.total_pts = QFont(DEFAULT_POINTS_FONT_FAMILY, 14 * scale * os_scale, weight=QFont.DemiBold)


class ScoreboardColors:
    def __init__(self, accent_color=DEFAULT_ACCENT_COLOR):
        self.main = ScoreboardColors._hex_to_rgb("#2F292B")
        self.light_grey = ScoreboardColors._hex_to_rgb("#EEEEEE")
        self.white = ScoreboardColors._hex_to_rgb("#FAFAFA")
        self.black = ScoreboardColors._hex_to_rgb("#212121")
        self.grey_text = ScoreboardColors._hex_to_rgb("#C4C4C4")
        self.white_text = ScoreboardColors._hex_to_rgb("#FFFFFF")
        self.country_text = ScoreboardColors._hex_to_rgb("#7E7E7E")

        self.accent = ScoreboardColors._hex_to_rgb(accent_color)
        luminance = (self.accent.red() * 0.299 + self.accent.green() * 0.587 + self.accent.blue() * 0.114) / 255
        if luminance > 0.5:
            self.accent_text = ScoreboardColors._hex_to_rgb("#212121")
        else:
            self.accent_text = ScoreboardColors._hex_to_rgb("#FFFFFF")

    @staticmethod
    def _hex_to_rgb(hex):
        rgb = webcolors.hex_to_rgb(hex)
        return QColor(rgb.red, rgb.green, rgb.blue)


class ScoreboardSizes:
    def __init__(self, details, fonts, voter_num):
        contest = details.contest
        self.voter_header = QFontMetrics(fonts.voter_header).boundingRect("Now Voting: {} ({}/{})".format(
            contest.voters[voter_num], voter_num, contest.num_voters)).width()
        self.contest_header = QFontMetrics(fonts.contest_header).boundingRect(
            "{} Results".format(details.title)).width()

        self.country = 0
        self.entry_details = 0
        country_fm = QFontMetrics(fonts.country)
        entry_fm = QFontMetrics(fonts.entry_details)
        for entry in details.contest.entries:
            current_country = entry_fm.boundingRect(entry.country).width()
            current_entry = country_fm.boundingRect(
                "{} – {}".format(entry.artist, entry.song)).width()

            if current_country > self.country:
                self.country = current_country
            if current_entry > self.entry_details:
                self.entry_details = current_entry

        if details.display_flags:
            self.flag_offset = 24 * details.scale
        else:
            self.flag_offset = 0

        self.rectangle = max(
            self.country, self.entry_details) + self.flag_offset + 80 * details.scale

        self.width = max(max(30 * details.scale + 2 * self.rectangle, 48 *
                             details.scale + self.contest_header), 10 * details.scale + self.voter_header)

        num_entries_in_left_column = int(contest.num_entries / 2) + contest.num_entries % 2
        self.height = 10 * details.scale + 35 * details.scale * num_entries_in_left_column + 70 * details.scale
