import fbs_runtime
import webcolors
from PyQt5.QtGui import QColor, QFont, QFontMetrics

DEFAULT_MAIN_COLOR = "#2F292B"
DEFAULT_ACCENT_COLOR = "#FCB906"

DEFAULT_IMAGE_scaling = 2.5
DEFAULT_WINDOWS_DPI_SCALING = 1.5

DEFAULT_BASE_FONT_FAMILY = "Zilla Slab"
DEFAULT_POINTS_FONT_FAMILY = "Fira Sans"


class ScoreboardDetails:
    def __init__(self, contest, output_dir, title, main_color, accent_color, display_flags=True, display_flag_borders=True,
                 image_scaling=DEFAULT_IMAGE_scaling, windows_dpi_scaling=DEFAULT_WINDOWS_DPI_SCALING):
        self.contest = contest
        self.output_dir = output_dir

        self.title = title
        self.main_color = main_color
        self.accent_color = accent_color
        self.display_flags = display_flags
        self.display_flag_borders = display_flag_borders
        self.scaling = image_scaling

        # On Windows, text is rendered differently depending on the DPI scaling factor which we need to account for
        self.windows_dpi_scaling = windows_dpi_scaling


class ScoreboardFonts:
    def __init__(self, image_scaling=DEFAULT_IMAGE_scaling, windows_dpi_scaling=DEFAULT_WINDOWS_DPI_SCALING):
        # Due to rendering differences between OSX and Windows, we need to scale down the text on Windows
        if fbs_runtime.platform.is_windows():
            windows_mac_canonical_pixel_ratio = 72.0 / 96.0
            adjustment_factor = (196.0 / 19.0) / 14.0
            windows_ui_scaling_factor = DEFAULT_WINDOWS_DPI_SCALING / windows_dpi_scaling
            font_os_scaling = windows_mac_canonical_pixel_ratio * adjustment_factor * windows_ui_scaling_factor
        else:
            font_os_scaling = 1.0
        self.voter_header = QFont(DEFAULT_BASE_FONT_FAMILY, 14 * image_scaling * font_os_scaling)
        self.contest_header = QFont(DEFAULT_BASE_FONT_FAMILY, 14 * image_scaling * font_os_scaling)
        self.country = QFont(DEFAULT_BASE_FONT_FAMILY, 12 * image_scaling * font_os_scaling)
        self.entry_details = QFont(DEFAULT_BASE_FONT_FAMILY, 12 * image_scaling * font_os_scaling)
        self.awarded_pts = QFont(DEFAULT_POINTS_FONT_FAMILY, 14 * image_scaling * font_os_scaling)
        self.total_pts = QFont(DEFAULT_POINTS_FONT_FAMILY, 14 * image_scaling * font_os_scaling, weight=QFont.DemiBold)


class ScoreboardColors:
    def __init__(self, main_color=DEFAULT_MAIN_COLOR, accent_color=DEFAULT_ACCENT_COLOR):
        self.light_grey = ScoreboardColors._hex_to_rgb("#EEEEEE")
        self.white = ScoreboardColors._hex_to_rgb("#FAFAFA")
        self.black = ScoreboardColors._hex_to_rgb("#212121")
        self.grey_text = ScoreboardColors._hex_to_rgb("#C4C4C4")
        self.white_text = ScoreboardColors._hex_to_rgb("#FFFFFF")
        self.country_text = ScoreboardColors._hex_to_rgb("#7E7E7E")

        self.main = ScoreboardColors._hex_to_rgb(main_color)
        luminance = (self.main.red() * 0.299 + self.main.green() * 0.587 + self.main.blue() * 0.114) / 255
        if luminance > 0.5:
            self.main_text = ScoreboardColors._hex_to_rgb("#212121")
        else:
            self.main_text = ScoreboardColors._hex_to_rgb("#FFFFFF")

        self.accent = ScoreboardColors._hex_to_rgb(accent_color)
        luminance = (self.accent.red() * 0.299 + self.accent.green() * 0.587 + self.accent.blue() * 0.114) / 255
        if luminance > 0.5:
            self.accent_text = ScoreboardColors._hex_to_rgb("#212121")
        else:
            self.accent_text = ScoreboardColors._hex_to_rgb("#FFFFFF")

    @staticmethod
    def _hex_to_rgb(hex_code):
        rgb = webcolors.hex_to_rgb(hex_code)
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
            self.flag_offset = 24 * details.scaling
        else:
            self.flag_offset = 0

        self.rectangle = max(
            self.country, self.entry_details) + self.flag_offset + 80 * details.scaling

        self.width = max(max(30 * details.scaling + 2 * self.rectangle, 48 *
                             details.scaling + self.contest_header), 10 * details.scaling + self.voter_header)

        num_entries_in_left_column = int(contest.num_entries / 2) + contest.num_entries % 2
        self.height = 10 * details.scaling + 35 * details.scaling * num_entries_in_left_column + 70 * details.scaling
