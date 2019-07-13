import sys
from os.path import join

from PySide2.QtGui import QFontDatabase
from fbs_runtime.application_context.PySide2 import ApplicationContext

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
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "FiraSans-Medium.otf")))
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "FiraSans-Regular.otf")))
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "ZillaSlab-Medium.otf")))
        QFontDatabase.addApplicationFont(self.get_resource(join("fonts", "ZillaSlab-Regular.otf")))


def main():
    app_context = AppContext()
    exit_code = app_context.run()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
