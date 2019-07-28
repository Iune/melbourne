from os import makedirs
from os.path import isdir, join

from PySide2.QtCore import Qt, QRect, QRectF, QPoint, QPointF, QSizeF
from PySide2.QtGui import QImage, QPainter, QPen
from pathvalidate import sanitize_filename

from scoreboard.utilities import ScoreboardColors, ScoreboardFonts, ScoreboardSizes


class Scoreboard:
    def __init__(self, app_context, details):
        self.app_context = app_context
        self.details = details
        self.contest = details.contest
        self.fonts = ScoreboardFonts(image_scaling=details.scaling, windows_dpi_scaling=details.windows_dpi_scaling)
        self.colors = ScoreboardColors(details.main_color, details.accent_color)

    def generate(self, voter_num):
        if not isdir(self.details.output_dir):
            makedirs(self.details.output_dir)

        sizes = ScoreboardSizes(self.details, self.fonts, voter_num)
        image = QImage(sizes.width, sizes.height, QImage.Format_ARGB32)

        painter = QPainter()
        painter.begin(image)
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setRenderHint(QPainter.TextAntialiasing, True)
        self._draw_scoreboard(painter, sizes, voter_num)
        painter.end()

        output_file_path = sanitize_filename("{} – {}.png".format(voter_num + 1, self.contest.voters[voter_num]))
        image.save(join(self.details.output_dir, output_file_path))

    def _draw_scoreboard(self, painter, sizes, voter_num):
        scaling = self.details.scaling
        contest = self.details.contest

        # Display scoreboard background rectangle
        self._draw_rectangle(painter, QPoint(0, 0), QPoint(sizes.width, sizes.height), self.colors.light_grey)

        # Display voter details
        self._draw_rectangle(painter, QPoint(0, 0), QPoint(sizes.width, 30 * scaling), self.colors.main)
        self._draw_text(painter, QPoint(10 * scaling, 15 * scaling),
                        "Now Voting: {} ({}/{})".format(contest.voters[voter_num], voter_num + 1, contest.num_voters),
                        self.fonts.voter_header, self.colors.main_text, Qt.AlignLeft)

        # Display contest title
        self._draw_rectangle(painter, QPoint(0, 30 * scaling), QPoint(sizes.width, 30 * scaling), self.colors.accent)
        self._draw_text(painter, QPoint(10 * scaling, 45 * scaling), "{} Results".format(self.details.title),
                        self.fonts.contest_header, self.colors.accent_text, Qt.AlignLeft)

        # Draw background rectangles for entry details
        left_col = int(self.contest.num_entries / 2) + self.contest.num_entries % 2
        right_col = self.contest.num_entries - left_col
        self._draw_rectangle(painter, QPoint(10 * scaling, 70 * scaling),
                             QPoint(sizes.rectangle, 0 * scaling + 35 * scaling * left_col), self.colors.white,
                             border=self.colors.grey_text, border_width=0.5 * scaling)
        self._draw_rectangle(painter, QPoint(20 * scaling + sizes.rectangle, 70 * scaling),
                             QPoint(sizes.rectangle, 0 * scaling + 35 * scaling * right_col), self.colors.white,
                             border=self.colors.grey_text, border_width=0.5 * scaling)

        entries = self.contest.results_after_voter(voter_num)
        for i, entry in enumerate(entries):
            if i < left_col:
                x_offset = 0
                y_offset = i
            else:
                x_offset = 10 * scaling + sizes.rectangle
                y_offset = i - left_col

            # Display the entry's country flag
            if self.details.display_flags:
                try:
                    flag = QImage(self.app_context.get_resource(join("flags", entry.flag)))
                    flag = flag.scaledToWidth(
                        20 * scaling, Qt.SmoothTransformation)
                    self._draw_rectangle(painter,
                                         QPoint(27 * scaling - flag.width() / 2.0 + x_offset, 87 *
                                                scaling - flag.height() / 2.0 + 35 * scaling * y_offset),
                                         QPoint(flag.width() + 0.5, flag.height() + 0.5),
                                         self.colors.white, border=self.colors.grey_text, border_width=0.5 * scaling)
                    painter.drawImage(QPoint(27 * scaling - flag.width() / 2.0 + x_offset,
                                             87 * scaling - flag.height() / 2.0 + 35 * scaling * y_offset), flag)
                except FileNotFoundError:
                    continue

            # Display entry details
            self._draw_text(painter,
                            QPoint(20 * scaling + x_offset + sizes.flag_offset, 80 * scaling + 35 * scaling * y_offset),
                            entry.country, self.fonts.country, self.colors.country_text, Qt.AlignLeft)
            self._draw_text(painter,
                            QPoint(20 * scaling + x_offset + sizes.flag_offset, 94 * scaling + 35 * scaling * y_offset),
                            "{} – {}".format(entry.artist, entry.song), self.fonts.entry_details, self.colors.black,
                            Qt.AlignLeft)

            # Display the entry's total number of received points
            if entry.dq_statuses[voter_num]:
                self._draw_rectangle(painter, QPoint(30 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                                     77 * scaling + 35 * scaling * y_offset),
                                     QPoint(29 * scaling, 20 * scaling), self.colors.grey_text)
                self._draw_text(painter, QPoint(44.5 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                                87 * scaling + 35 * scaling * y_offset),
                                "{}".format(entry.display_pts[voter_num]),
                                self.fonts.total_pts, self.colors.black, Qt.AlignHCenter)
            else:
                self._draw_rectangle(painter, QPoint(30 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                                     77 * scaling + 35 * scaling * y_offset),
                                     QPoint(29 * scaling, 20 * scaling), self.colors.main)
                self._draw_text(painter, QPoint(44.5 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                                87 * scaling + 35 * scaling * y_offset),
                                "{}".format(entry.display_pts[voter_num]),
                                self.fonts.total_pts, self.colors.main_text, Qt.AlignHCenter)

            # Display the entry's number of points received by the current voter
            if len(entry.votes[voter_num]) > 0:
                self._draw_rectangle(painter,
                                     QPoint(59 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                            77 * scaling + 35 * scaling * y_offset),
                                     QPoint(24 * scaling, 20 * scaling), self.colors.accent)

                try:
                    votes_string = int(float(entry.votes[voter_num]))
                except ValueError:
                    votes_string = entry.votes[voter_num]
                self._draw_text(painter, QPoint(71 * scaling + x_offset + sizes.flag_offset + sizes.entry_details,
                                                87 * scaling + 35 * scaling * y_offset),
                                str(votes_string), self.fonts.awarded_pts, self.colors.accent_text, Qt.AlignHCenter)

            # Draw a dividing line between entries
            if i + 1 != left_col and i + 1 != self.contest.num_entries:
                painter.setPen(QPen(self.colors.grey_text, 0.5 * scaling))
                painter.drawLine(
                    QPoint(10 * scaling + x_offset, 104.5 * scaling + 35 * scaling * y_offset),
                    QPoint(10 * scaling + x_offset + sizes.rectangle, 104.5 * scaling + 35 * scaling * y_offset))

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
