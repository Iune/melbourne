from os import makedirs
from os.path import isdir, join

from PyQt5.QtCore import Qt, QRect, QRectF, QPoint, QPointF, QSizeF
from PyQt5.QtGui import QImage, QPainter, QPen
from pathvalidate import sanitize_filename
from scoreboard.utilities import ScoreboardColors, ScoreboardFonts, ScoreboardSizes

DEFAULT_FONT_FAMILY = "Comfortaa"


class Scoreboard:
    def __init__(self, app_context, details, font_family=DEFAULT_FONT_FAMILY):
        self.app_context = app_context
        self.details = details
        self.contest = details.contest
        self.fonts = ScoreboardFonts(font_family, details.scale)
        self.colors = ScoreboardColors(details.accent_color)

    def generate(self, voter_num):
        if not isdir(self.details.output_dir):
            makedirs(self.details.output_dir)

        sizes = ScoreboardSizes(self.details, self.fonts, voter_num)
        image = QImage(sizes.width, sizes.height, QImage.Format_ARGB32)

        painter = QPainter()
        painter.begin(image)
        painter.setRenderHint(QPainter.Antialiasing, True)
        self._draw_scoreboard(painter, sizes, voter_num)
        painter.end()

        output_file_path = sanitize_filename("{} – {}.png".format(voter_num + 1, self.contest.voters[voter_num]))
        image.save(join(self.details.output_dir, output_file_path))

    def _draw_scoreboard(self, painter, sizes, voter_num):
        scale = self.details.scale
        contest = self.details.contest

        # Display scoreboard background rectangle
        self._draw_rectangle(painter, QPoint(0, 0), QPoint(sizes.width, sizes.height), self.colors.light_grey)

        # Display voter details
        self._draw_rectangle(painter, QPoint(0, 0), QPoint(sizes.width, 30 * scale), self.colors.main)
        self._draw_text(painter, QPoint(10 * scale, 15 * scale),
                        "Now Voting: {} ({}/{})".format(contest.voters[voter_num], voter_num + 1, contest.num_voters),
                        self.fonts.voter_header, self.colors.white_text, Qt.AlignLeft)

        # Display contest title
        self._draw_rectangle(painter, QPoint(0, 30 * scale), QPoint(sizes.width, 30 * scale), self.colors.accent)
        self._draw_text(painter, QPoint(10 * scale, 45 * scale), "{} Results".format(self.details.title),
                        self.fonts.voter_header, self.colors.accent_text, Qt.AlignLeft)

        # Draw background rectangles for entry details
        left_col = self.contest.num_entries / 2 + self.contest.num_entries % 2
        right_col = self.contest.num_entries - left_col
        self._draw_rectangle(painter, QPoint(10 * scale, 70 * scale),
                             QPoint(sizes.rectangle, 4 * scale + 35 * scale * left_col), self.colors.white,
                             border=self.colors.grey_text, border_width=0.5 * scale)
        self._draw_rectangle(painter, QPoint(20 * scale + sizes.rectangle, 70 * scale),
                             QPoint(sizes.rectangle, 4 * scale + 35 * scale * right_col), self.colors.white,
                             border=self.colors.grey_text, border_width=0.5 * scale)

        entries = self.contest.results_after_voter(voter_num)
        for i, entry in enumerate(entries):
            if i < left_col:
                x_offset = 0
                y_offset = i
            else:
                x_offset = 10 * scale + sizes.rectangle
                y_offset = i - left_col

            # Display the entry's country flag
            if self.details.display_flags:
                try:
                    flag = QImage(self.app_context.get_resource(join("flags", entry.flag)))
                    flag = flag.scaledToWidth(
                        20 * scale, Qt.SmoothTransformation)
                    self._draw_rectangle(painter,
                                         QPoint(27 * scale - flag.width() / 2.0 + x_offset, 87 *
                                                scale - flag.height() / 2.0 + 35 * scale * y_offset),
                                         QPoint(flag.width() + 0.5, flag.height() + 0.5),
                                         self.colors.white, border=self.colors.grey_text, border_width=0.5 * scale)
                    painter.drawImage(QPoint(27 * scale - flag.width() / 2.0 + x_offset,
                                             87 * scale - flag.height() / 2.0 + 35 * scale * y_offset), flag)
                except FileNotFoundError:
                    continue

            # Display entry details
            self._draw_text(painter,
                            QPoint(20 * scale + x_offset + sizes.flag_offset, 80 * scale + 35 * scale * y_offset),
                            entry.country, self.fonts.country, self.colors.country_text, Qt.AlignLeft)
            self._draw_text(painter,
                            QPoint(20 * scale + x_offset + sizes.flag_offset, 94 * scale + 35 * scale * y_offset),
                            "{} – {}".format(entry.artist, entry.song), self.fonts.country, self.colors.black,
                            Qt.AlignLeft)

            # Display the entry's total number of received points
            self._draw_rectangle(painter, QPoint(30 * scale + x_offset + sizes.flag_offset + sizes.entry_details,
                                                 77 * scale + 35 * scale * y_offset),
                                 QPoint(29 * scale, 20 * scale), self.colors.main)
            self._draw_text(painter, QPoint(44.5 * scale + x_offset + sizes.flag_offset + sizes.entry_details,
                                            87 * scale + 35 * scale * y_offset),
                            "{}".format(entry.display_pts[voter_num]),
                            self.fonts.total_pts, self.colors.white_text, Qt.AlignHCenter)

            # Display the entry's number of points received by the current voter
            if len(entry.votes[voter_num]) > 0:
                self._draw_rectangle(painter,
                                     QPoint(59 * scale + x_offset + sizes.flag_offset + sizes.entry_details,
                                            77 * scale + 35 * scale * y_offset),
                                     QPoint(24 * scale, 20 * scale), self.colors.accent)

                try:
                    votes_string = int(float(entry.votes[voter_num]))
                except ValueError:
                    votes_string = entry.votes[voter_num]
                self._draw_text(painter, QPoint(71 * scale + x_offset + sizes.flag_offset + sizes.entry_details,
                                                87 * scale + 35 * scale * y_offset),
                                str(votes_string), self.fonts.awarded_pts, self.colors.accent_text, Qt.AlignHCenter)

            # Draw a dividing line between entries
            if i + 1 != left_col and i + 1 != self.contest.num_entries:
                painter.setPen(QPen(self.colors.grey_text, 0.5 * scale))
                painter.drawLine(
                    QPoint(10 * scale + x_offset, 106 * scale + 35 * scale * y_offset),
                    QPoint(10 * scale + x_offset + sizes.rectangle, 106 * scale + 35 * scale * y_offset))

    @staticmethod
    def _draw_text(painter, point, text, font, color, flags):
        painter.setPen(color)
        painter.setFont(font)
        Scoreboard._draw_text_helper(painter, point, text, flags | Qt.AlignVCenter)

    @staticmethod
    def _draw_text_helper(painter, point, text, flags):
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

        rect = QRectF(QPointF(new_x, new_y), QSizeF(size, size))
        painter.drawText(rect, flags, text)

    @staticmethod
    def _draw_rectangle(painter, point, size, fill, border=None, border_width=0):
        if border:
            painter.setBrush(fill)
            painter.setPen(QPen(border, border_width))
            painter.drawRect(QRect(point.x(), point.y(), size.x(), size.y()))
        else:
            painter.fillRect(
                QRect(point.x(), point.y(), size.x(), size.y()), fill)
