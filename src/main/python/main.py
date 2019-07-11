import sys

from fbs_runtime.application_context.PyQt5 import ApplicationContext
from PyQt5.QtWidgets import QMainWindow


if __name__ == '__main__':
    appctxt = ApplicationContext()
    window = QMainWindow()
    window.setWindowTitle("Melbourne")
    window.resize(250, 150)
    window.show()

    exit_code = appctxt.app.exec_()
    sys.exit(exit_code)
