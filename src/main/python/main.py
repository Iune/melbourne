import sys
from os.path import join

from PyQt5.QtGui import QFontDatabase
from fbs_runtime.application_context.PyQt5 import ApplicationContext

from gui.window import MainWindow


class AppContext(ApplicationContext):
    def run(self):
        self._register_fonts()
        self.app.setStyle("Fusion")
        self.app.setApplicationName("Melbourne")
        window = MainWindow(self)
        window.show()
        return self.app.exec_()

    def _register_fonts(self):
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "Ubuntu-B.ttf")))
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "Ubuntu-R.ttf")))


def main():
    app_context = AppContext()
    exit_code = app_context.run()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
