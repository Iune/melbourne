import sys
import time
from os.path import expanduser

import qdarkstyle
import webcolors
from PyQt5.QtCore import QThread, pyqtSignal
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from fbs_runtime.application_context.PyQt5 import ApplicationContext

from contest.contest import Contest
from scoreboard.scoreboard import Scoreboard
from scoreboard.utilities import ScoreboardDetails


class MainWindow(QDialog):
    def __init__(self, app_context):
        super(MainWindow, self).__init__()
        self.app_context = app_context
        self.title = "Melbourne"
        self.contest = None
        self.thread = None
        self._init_ui()
        self.show()

    def _init_ui(self):
        self.setWindowTitle(self.title)
        self.resize(500, 400)
        self.setMinimumSize(500, 400)
        self._create_layout()

    def _create_layout(self):
        self.file_details_group_box = QGroupBox("File Details")
        file_details_grid = QGridLayout()
        file_details_grid.setColumnStretch(1, 2)

        self.input_file_le = QLineEdit()
        self.input_file_le.setReadOnly(True)
        self.input_file_le.textChanged.connect(self._check_if_ready)
        self.input_file_btn = QPushButton("Select")
        self.input_file_btn.clicked.connect(self._set_input_file)
        file_details_grid.addWidget(QLabel("Input File"), 0, 0)
        file_details_grid.addWidget(self.input_file_le, 0, 1)
        file_details_grid.addWidget(self.input_file_btn, 0, 2)

        self.output_dir_le = QLineEdit()
        self.output_dir_le.setReadOnly(True)
        self.output_dir_le.textChanged.connect(self._check_if_ready)
        self.output_dir_btn = QPushButton("Select")
        self.output_dir_btn.clicked.connect(self._set_output_dir)
        file_details_grid.addWidget(QLabel("Output Folder"), 1, 0)
        file_details_grid.addWidget(self.output_dir_le, 1, 1)
        file_details_grid.addWidget(self.output_dir_btn, 1, 2)

        self.file_details_group_box.setLayout(file_details_grid)

        self.contest_details_group_box = QGroupBox("Scoreboard Details")
        contest_details_grid = QGridLayout()
        contest_details_grid.setColumnStretch(1, 2)

        self.contest_name_le = QLineEdit()
        self.contest_name_le.textChanged.connect(self._check_if_ready)
        contest_details_grid.addWidget(QLabel("Contest Name"), 0, 0)
        contest_details_grid.addWidget(self.contest_name_le, 0, 1, 1, 2)

        self.color_btn = QPushButton("#FCB906")
        self.color_btn.clicked.connect(self._set_accent_color)
        self.color_reset_btn = QPushButton("Reset")
        self.color_reset_btn.clicked.connect(self._reset_color)
        contest_details_grid.addWidget(QLabel("Accent Color"), 1, 0)
        contest_details_grid.addWidget(self.color_btn, 1, 1)
        contest_details_grid.addWidget(self.color_reset_btn, 1, 2)

        self.display_flags_rb = QRadioButton("Display Flags")
        contest_details_grid.addWidget(self.display_flags_rb, 2, 0, 1, 2)

        self.contest_details_group_box.setLayout(contest_details_grid)

        self.generation_details_group_box = QGroupBox("Generate Scoreboards")
        generation_details_hbox = QHBoxLayout()

        self.progress_bar = QProgressBar()
        self.generate_btn = QPushButton("Generate")
        self.generate_btn.setEnabled(False)
        self.generate_btn.clicked.connect(self._generate_scoreboards)
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(self._cancel_generation)
        generation_details_hbox.addWidget(self.progress_bar, 3)
        generation_details_hbox.addWidget(self.generate_btn)
        generation_details_hbox.addWidget(self.cancel_btn)

        self.generation_details_group_box.setLayout(generation_details_hbox)

        layout = QVBoxLayout()
        layout.addWidget(self.file_details_group_box)
        layout.addWidget(self.contest_details_group_box)
        layout.addWidget(self.generation_details_group_box)
        self.setLayout(layout)

    def _set_input_file(self):
        home_dir = expanduser("~")
        dialog = QFileDialog(self, "Select Excel File", home_dir, "Excel (*.xls, *.xlsx)")
        dialog.setFileMode(QFileDialog.ExistingFile)
        path = dialog.getOpenFileName()
        if path:
            input_file = path[0]
            self.input_file_le.setText(input_file)
            self.contest = Contest.from_file(input_file)

    def _set_output_dir(self):
        home_dir = expanduser("~")
        path = QFileDialog.getExistingDirectory(self, "Select Output Directory", home_dir, QFileDialog.ShowDirsOnly)
        if path:
            output_dir = path
            self.output_dir_le.setText(output_dir)

    def _set_accent_color(self):
        color_btn_hex = webcolors.hex_to_rgb(self.color_btn.text())
        accent_color = QColor(color_btn_hex.red, color_btn_hex.green, color_btn_hex.blue)

        dialog = QColorDialog()
        dialog.setCurrentColor(accent_color)
        color = dialog.getColor(accent_color, self, "Select Accent Color")
        if color.isValid():
            hex_color = webcolors.rgb_to_hex((color.red(), color.green(), color.blue())).upper()
            self.color_btn.setText(hex_color)

    def _reset_color(self):
        self.color_btn.setText("#FCB906")

    def _check_if_ready(self):
        if self.contest and len(self.output_dir_le.text()) > 0 and len(self.contest_name_le.text()) > 0:
            self.generate_btn.setEnabled(True)
        else:
            self.generate_btn.setEnabled(False)

    def _generate_scoreboards(self):
        self.progress_bar.setMaximum(self.contest.num_voters)
        self.progress_bar.setValue(0)
        self.thread = ScoreboardThread(
            self.app_context,
            ScoreboardDetails(
                contest=self.contest,
                output_dir=self.output_dir_le.text(),
                title=self.contest_name_le.text(),
                accent_color=self.color_btn.text(),
                display_flags=self.display_flags_rb.isChecked()
            ))
        self.thread.progress.connect(self._update_progress_bar)
        self.thread.finished.connect(self._finished_generation)
        self.cancel_btn.setEnabled(True)
        self.generate_btn.setEnabled(False)
        self.thread.start()

    def _finished_generation(self):
        self.cancel_btn.setEnabled(False)
        self.generate_btn.setEnabled(True)

    def _cancel_generation(self):
        self.thread.stop()
        self.thread.wait()
        self.progress_bar.setValue(0)
        self.cancel_btn.setEnabled(False)
        self.generate_btn.setEnabled(True)

    def _update_progress_bar(self, voter):
        self.progress_bar.setValue(voter)


class ScoreboardThread(QThread):
    progress = pyqtSignal(int)

    def __init__(self, app_context, details, parent=None):
        QThread.__init__(self, parent)
        self.app_context = app_context
        self.details = details
        self.running = False

    def run(self):
        generator = Scoreboard(self.app_context, self.details)
        self.running = True
        for voter_num, voter in enumerate(self.details.contest.voters):
            if self.running:
                generator.generate(voter_num)
                self.progress.emit(voter_num+1)
            else:
                break

    def stop(self):
        self.running = False


def main():
    app_context = ApplicationContext()
    # app_context.app.setStyle("Fusion")
    app_context.app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
    window = MainWindow(app_context)
    exit_code = app_context.app.exec_()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()

    # file_path = "/Users/aditya/Documents/2003.xlsx"
    # contest = Contest.from_file(file_path)
    # details = ScoreboardDetails(
    #     contest=contest,
    #     title="ISC Revisits Eurovision: ESC 2003",
    #     output_dir="/Users/aditya/Desktop/2003_New",
    #     accent_color="#9D2235",
    #     display_flags=False
    # )
    #
    # generator = Scoreboard(appctxt, details)
    #
    # for i in range(contest.num_voters):
    #     print(contest.voters[i])
    #     generator.generate(i)
