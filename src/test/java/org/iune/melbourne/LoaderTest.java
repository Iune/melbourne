package org.iune.melbourne;

import org.iune.melbourne.contest.Loader;
import org.junit.Test;

import java.io.File;
import java.io.IOException;

import static org.junit.Assert.*;

public class LoaderTest {

    @Test
    public void detectEncodingTestUTFFile() throws IOException {
        File inputFile = new File("src/test/resources/189-UTF-8.csv");
        String encoding = Loader.detectFileEncoding(inputFile);
        assertTrue(encoding.equals("UTF-8"));
    }

    @Test
    public void detectEncodingTestWindows1252File() throws IOException {
        File inputFile = new File("src/test/resources/189-1252.csv");
        String encoding = Loader.detectFileEncoding(inputFile);
        assertTrue(encoding.equals("WINDOWS-1252"));
    }

    @Test(expected = IOException.class)
    public void detectEncodingTestMissingFile() throws IOException {
        File inputFile = new File("src/test/resources/189-invalid.csv");
        String encoding = Loader.detectFileEncoding(inputFile);
    }
}