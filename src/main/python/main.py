import sys

from PyQt5.QtWidgets import QMainWindow
from contest.contest import Contest
from fbs_runtime.application_context.PyQt5 import ApplicationContext
from scoreboard.scoreboard import Scoreboard
from scoreboard.utilities import ScoreboardDetails

if __name__ == '__main__':
    appctxt = ApplicationContext()
    window = QMainWindow()
    window.setWindowTitle("Melbourne")
    window.resize(250, 150)
    window.show()

    file_path = "/Users/aditya/Documents/2003.xlsx"
    contest = Contest.from_file(file_path)
    details = ScoreboardDetails(
        contest=contest,
        title="ISC Revisits Eurovision: ESC 2003",
        output_dir="/Users/aditya/Desktop/2003_New",
        accent_color="#9D2235"
    )

    generator = Scoreboard(appctxt, details)

    for i in range(contest.num_voters):
        print(contest.voters[i])
        generator.generate(i)

    exit_code = appctxt.app.exec_()
    sys.exit(exit_code)
