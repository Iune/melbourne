# melbourne-gui

`melbourne-gui` is the version of `melbourne` with a graphical user interface.

# Building

To build `melbourne-gui` with a JAR file, run the following command in the terminal:

```
mvn clean package jfx:jar
```

When aiming to deploy `melbourne-gui`, run the following command to build the required application installers:

```
mvn clean package jfx:native
```
