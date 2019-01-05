# melbourne-cli

`melbourne-cli` is the version of `melbourne` accessible through the command-line.

# Building

To build `melbourne-cli`, run the following command in the terminal:

```
mvn clean package shade:shade
```

# Usage

To use `melbourne-cli`, two arguments must be specified:

* `contestName` is the name of the contest. The program will automatically append `Results` to the contest name when printing the results. For example, `FSC 189` would yield `FSC 189 Results`.
* `filePath` is the path to the input CSV file.