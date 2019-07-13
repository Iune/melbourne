from os.path import expanduser
from os.path import join

import qtawesome as qta
import webcolors
from PySide2.QtCore import Qt
from PySide2.QtGui import QColor, QKeySequence, QPixmap
from PySide2.QtWidgets import QGridLayout, QGroupBox, QLineEdit, QPushButton, QLabel, QVBoxLayout, QWidget, \
    QCheckBox, QProgressBar, QFileDialog, QColorDialog, QMessageBox, QMainWindow, QAction, QDialogButtonBox, QDialog

from contest.contest import Contest
from gui.thread import ScoreboardThread
from scoreboard.utilities import ScoreboardDetails

DEFAULT_ACCENT_COLOR = "#FCB906"


class MainWindow(QMainWindow):
    def __init__(self, app_context):
        super(MainWindow, self).__init__()
        self.app_context = app_context
        self.title = 'Melbourne'

        self.contest = None
        self.thread = None

        self._init_window()
        self._init_layout()
        self._init_menus()

    def _init_window(self):
        self.setWindowTitle(self.title)

        # Set Window Size
        self.setMaximumSize(500, 325)
        self.setMinimumSize(500, 325)
        self.resize(500, 325)

    def _init_menus(self):
        menu = self.menuBar()

        file_menu = menu.addMenu('&File')

        input_file_action = QAction("Select Input File", self)
        input_file_action.triggered.connect(self._set_input_file)
        input_file_action.setShortcut(QKeySequence.Open)

        output_folder_action = QAction("Select Output Folder", self)
        output_folder_action.triggered.connect(self._set_output_folder)
        output_folder_action.setShortcut(QKeySequence("Ctrl+Shift+O"))

        reload_contest_action = QAction("Reload Contest Details", self)
        reload_contest_action.triggered.connect(self._reload_contest)
        reload_contest_action.setShortcut(QKeySequence("Ctrl+R"))

        file_menu.addAction(input_file_action)
        file_menu.addAction(output_folder_action)
        file_menu.addAction(reload_contest_action)

        help_menu = self.menuBar().addMenu("&Help")
        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about_dialog)
        help_menu.addAction(about_action)

    def _init_layout(self):
        # File Details Grid
        file_details_grid = QGridLayout()
        file_details_grid.setColumnStretch(1, 2)

        self.input_file_btn = QPushButton(qta.icon('fa5.file-excel', color="#2E7D32"), ' Input File')
        self.input_file_btn.setDefault(False)
        self.input_file_btn.setAutoDefault(False)
        self.input_file_btn.clicked.connect(self._set_input_file)
        self.input_file_le = QLineEdit()
        self.input_file_le.setReadOnly(True)
        self.input_file_le.textChanged.connect(self._check_if_ready)
        self.output_folder_btn = QPushButton(qta.icon('fa5s.folder', color="#0277BD"), ' Output Folder')
        self.output_folder_btn.setDefault(False)
        self.output_folder_btn.setAutoDefault(False)
        self.output_folder_btn.clicked.connect(self._set_output_folder)
        self.output_folder_le = QLineEdit()
        self.output_folder_le.setReadOnly(True)
        self.output_folder_le.textChanged.connect(self._check_if_ready)

        file_details_grid.addWidget(self.input_file_btn, 0, 0)
        file_details_grid.addWidget(self.input_file_le, 0, 1)
        file_details_grid.addWidget(self.output_folder_btn, 1, 0)
        file_details_grid.addWidget(self.output_folder_le, 1, 1)
        file_details_group = QGroupBox('File Details')
        file_details_group.setLayout(file_details_grid)

        # Scoreboard Details Grid
        scoreboard_details_grid = QGridLayout()
        scoreboard_details_grid.setColumnStretch(2, 2)

        self.scoreboard_title_le = QLineEdit()
        self.scoreboard_title_le.textChanged.connect(self._check_if_ready)
        self.accent_color_btn = QPushButton(qta.icon('fa5s.brush', color=DEFAULT_ACCENT_COLOR), ' Accent Color')
        self.accent_color_btn.setDefault(False)
        self.accent_color_btn.setAutoDefault(False)
        self.accent_color_btn.clicked.connect(self._set_accent_color)
        self.reset_accent_color_btn = QPushButton(qta.icon('fa5s.redo-alt', color="#212121"), ' Reset')
        self.reset_accent_color_btn.setDefault(False)
        self.reset_accent_color_btn.setAutoDefault(False)
        self.reset_accent_color_btn.clicked.connect(self._reset_accent_color)
        self.accent_color_le = QLineEdit(DEFAULT_ACCENT_COLOR)
        self.accent_color_le.setReadOnly(True)
        self.display_flags_check = QCheckBox('Display Flags')
        self.display_flags_check.setChecked(False)
        self.display_flags_check.stateChanged.connect(self._validate_flags)

        scoreboard_details_grid.addWidget(QLabel('Scoreboard Title'), 0, 0)
        scoreboard_details_grid.addWidget(self.scoreboard_title_le, 0, 1, 1, 2)
        scoreboard_details_grid.addWidget(self.accent_color_btn, 1, 0)
        scoreboard_details_grid.addWidget(self.reset_accent_color_btn, 1, 1)
        scoreboard_details_grid.addWidget(self.accent_color_le, 1, 2)
        scoreboard_details_grid.addWidget(self.display_flags_check, 2, 0, 1, 3)
        scoreboard_details_group = QGroupBox('Scoreboard Details')
        scoreboard_details_group.setLayout(scoreboard_details_grid)

        # Generation Grid
        generation_grid = QGridLayout()
        generation_grid.setColumnStretch(0, 2)

        self.progress_bar = QProgressBar()
        self.generate_btn = QPushButton(qta.icon('fa5s.play', color='#4CAF50'), ' Generate')
        self.generate_btn.setEnabled(False)
        self.generate_btn.setDefault(False)
        self.generate_btn.setAutoDefault(False)
        self.generate_btn.clicked.connect(self._generate_scoreboards)
        self.cancel_btn = QPushButton(qta.icon('fa5s.stop', color='#F44336'), ' Cancel')
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.setDefault(False)
        self.cancel_btn.setAutoDefault(False)
        self.cancel_btn.clicked.connect(self._cancel_generation)

        generation_grid.addWidget(self.progress_bar, 0, 0)
        generation_grid.addWidget(self.generate_btn, 0, 1)
        generation_grid.addWidget(self.cancel_btn, 0, 2)

        generation_group = QWidget()
        generation_group.setLayout(generation_grid)

        layout = QVBoxLayout()
        layout.addWidget(file_details_group)
        layout.addWidget(scoreboard_details_group)
        layout.addWidget(generation_group)

        central_widget = QWidget()
        central_widget.setLayout(layout)
        self.setCentralWidget(central_widget)

    def _show_about_dialog(self):
        about_dialog = AboutDialog(self.app_context)
        about_dialog.exec_()

    def _set_input_file(self):
        home_directory = expanduser('~')
        dialog = QFileDialog()
        dialog.setFileMode(QFileDialog.ExistingFile)
        path = dialog.getOpenFileName(self, 'Select Excel Spreadsheet', home_directory, 'Excel (*.xls, *.xlsx)')
        if path and len(path[0]) > 0:
            self.input_file_le.setText(path[0])
            self._load_contest()

    def _load_contest(self):
        if len(self.input_file_le.text()) > 0:
            try:
                self.contest = Contest.from_file(self.input_file_le.text())
                self._validate_flags()
            except ValueError as err:
                self.input_file_le.setText("")
                self.contest = None
                self._check_if_ready()
                alert = QMessageBox()
                alert.setIcon(QMessageBox.Critical)
                alert.setText("Unable to load contest details from file")
                alert.setWindowTitle("Error Loading Contest")
                alert.setDetailedText("{}".format(err))
                alert.setStandardButtons(QMessageBox.Ok)
                alert.setDefaultButton(QMessageBox.Ok)
                alert.setEscapeButton(QMessageBox.Ok)
                alert.exec_()

    def _reload_contest(self):
        self._load_contest()

        alert = QMessageBox()
        alert.setIcon(QMessageBox.Information)
        alert.setText("Successfully reloaded contest details from file")
        alert.setWindowTitle("Reloaded Contest Details")
        alert.setStandardButtons(QMessageBox.Ok)
        alert.setDefaultButton(QMessageBox.Ok)
        alert.setEscapeButton(QMessageBox.Ok)
        alert.exec_()

    def _set_output_folder(self):
        home_directory = expanduser('~')
        dialog = QFileDialog()
        dialog.setFileMode(QFileDialog.DirectoryOnly)
        path = dialog.getExistingDirectory(self, 'Select Output Folder', home_directory, QFileDialog.ShowDirsOnly)
        if path and len(path) > 0:
            self.output_folder_le.setText(path)

    def _set_accent_color(self):
        color_btn_hex = webcolors.hex_to_rgb(self.accent_color_le.text())
        accent_color = QColor(color_btn_hex.red, color_btn_hex.green, color_btn_hex.blue)

        dialog = QColorDialog()
        dialog.setCurrentColor(accent_color)
        color = dialog.getColor(accent_color, self, "Select Accent Color")
        if color.isValid():
            hex_color = webcolors.rgb_to_hex((color.red(), color.green(), color.blue())).upper()
            self.accent_color_le.setText(hex_color)
            self.accent_color_btn.setIcon(qta.icon('fa5s.brush', color=hex_color))

    def _reset_accent_color(self):
        self.accent_color_le.setText(DEFAULT_ACCENT_COLOR)
        self.accent_color_btn.setIcon(qta.icon('fa5s.brush', color=DEFAULT_ACCENT_COLOR))

    def _validate_flags(self):
        def get_invalid_flags(self):
            invalid = []
            for flag in [entry.flag for entry in self.contest.entries]:
                try:
                    self.app_context.get_resource(join("flags", flag))
                except FileNotFoundError:
                    invalid.append(flag)
            return invalid

        if self.contest:
            if self.display_flags_check.isChecked():
                invalid_flags = get_invalid_flags(self)
                if invalid_flags:
                    self.display_flags_check.setChecked(False)
                    alert = QMessageBox()
                    alert.setIcon(QMessageBox.Warning)
                    alert.setText("Invalid flags were specified in the input file.")
                    alert.setWindowTitle("Invalid Flags Specified")
                    alert.setDetailedText(
                        '\n'.join(sorted(["{} was not found".format(flag) for flag in invalid_flags])))
                    alert.setStandardButtons(QMessageBox.Ok)
                    alert.setDefaultButton(QMessageBox.Ok)
                    alert.setEscapeButton(QMessageBox.Ok)
                    alert.exec_()

    def _check_if_ready(self):
        if self.contest and len(self.output_folder_le.text()) > 0 and len(self.scoreboard_title_le.text()) > 0:
            self.generate_btn.setEnabled(True)
        else:
            self.generate_btn.setEnabled(False)

    def _generate_scoreboards(self):
        self._validate_flags()
        self.progress_bar.setMaximum(self.contest.num_voters)
        self.progress_bar.setValue(0)

        self.thread = ScoreboardThread(
            self.app_context,
            ScoreboardDetails(
                contest=self.contest,
                output_dir=self.output_folder_le.text(),
                title=self.scoreboard_title_le.text(),
                accent_color=self.accent_color_le.text(),
                display_flags=self.display_flags_check.isChecked()
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


class AboutDialog(QDialog):
    def __init__(self, app_context):
        super(AboutDialog, self).__init__()

        ok_btn = QDialogButtonBox.Ok
        self.button_box = QDialogButtonBox(ok_btn)
        self.button_box.accepted.connect(self.accept)
        self.button_box.rejected.connect(self.reject)

        layout = QVBoxLayout()

        title = QLabel("Melbourne")
        font = title.font()
        font.setPointSize(20)
        font.setBold(True)
        title.setFont(font)

        logo = QLabel()
        logo.setPixmap(QPixmap(app_context.get_resource("logo_128.png")))

        layout.addWidget(title)
        layout.addWidget(logo)
        layout.addWidget(QLabel("Version 5.0.0"))
        layout.addWidget(QLabel("Copyright © Aditya Duri"))

        for i in range(0, layout.count()):
            layout.itemAt(i).setAlignment(Qt.AlignHCenter)

        layout.addWidget(self.button_box)
        self.setLayout(layout)
