import sys

import qdarkstyle
from fbs_runtime.application_context.PyQt5 import ApplicationContext

from gui.window import MainWindow


class AppContext(ApplicationContext):
    def run(self):
        # self.app.setStyleSheet(qdarkstyle.load_stylesheet_pyqt5())
        self.app.setStyle("Fusion")
        window = MainWindow(self)
        window.show()
        return self.app.exec_()


def main():
    app_context = AppContext()
    exit_code = app_context.run()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
