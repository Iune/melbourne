import webcolors
from PyQt5.QtGui import QColor, QFont, QFontMetrics

DEFAULT_ACCENT_COLOR = "#FCB906"
DEFAULT_SCALE = 3.0


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
    def __init__(self, family, scale=DEFAULT_SCALE):
        self.voter_header = QFont(family, 14 * scale)
        self.contest_header = QFont(family, 14 * scale, weight=QFont.Bold)
        self.country = QFont(family, 12 * scale)
        self.entry_details = QFont(family, 12 * scale)
        self.awarded_pts = QFont(family, 14 * scale)
        self.total_pts = QFont(family, 14 * scale, weight=QFont.Bold)


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
        if self.accent.red() * 0.299 + self.accent.green() * 0.587 + self.accent.blue() * 0.114 > 186:
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

        num_entries_in_left_column = contest.num_entries / 2 + contest.num_entries % 2
        self.height = 2 * details.scale + 35 * details.scale * num_entries_in_left_column + 80 * details.scale
