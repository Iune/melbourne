from PySide2.QtCore import QThread, Signal, Slot

from scoreboard.scoreboard import Scoreboard


class ScoreboardThread(QThread):
    progress = Signal(int)

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
                self.progress.emit(voter_num + 1)
            else:
                break

    def stop(self):
        self.running = False
