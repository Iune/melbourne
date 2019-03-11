# melbourne-cli

`melbourne-cli` is the version of `melbourne` accessible through the command-line.

# Building

To build `melbourne-cli`, run the following command in the terminal:

```
mvn clean package shade:shade
```

# Usage

```
java -jar melbourne-cli.jar contestName filePath
```

To use `melbourne-cli`, two arguments must be specified:

* `contestName` is the name of the contest. The program will automatically append "Results" to the `contestName` when returning results; "FSC 189" would yield "FSC 189 Results".
* `filePath` is the path to the input CSV file.