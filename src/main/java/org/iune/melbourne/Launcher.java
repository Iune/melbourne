package org.iune.melbourne;

import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;

public class Launcher extends Application {

    private int counter = 0;

    public static void main(String[] args) {
        launch();
    }

    @SuppressWarnings("static-access")
    public void start(Stage stage) {
        stage.setTitle("Hello World!");
        stage.getIcons().add(new Image(Launcher.class.getResourceAsStream("/Logo.png")));

        StackPane root = new StackPane();
        stage.setScene(new Scene(root, 250, 250));
        stage.show();

    }

}
