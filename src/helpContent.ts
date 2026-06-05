/**
 * Represents one formatted help text fragment.
 */
export interface HelpTextFragment {
  href?: string;
  text: string;
  type: 'bold' | 'code' | 'link' | 'text';
}

/**
 * Represents one paragraph or list item made of formatted fragments.
 */
export type HelpRichText = HelpTextFragment[];

/**
 * Represents one help section shown in the Help view.
 */
export interface HelpSection {
  body?: HelpRichText[];
  items?: HelpRichText[];
  title: string;
  titleLevel: 1 | 2 | 3 | 4;
}

/**
 * Creates a plain text fragment.
 */
function text(value: string): HelpTextFragment {
  return { text: value, type: 'text' };
}

/**
 * Creates a bold text fragment.
 */
function bold(value: string): HelpTextFragment {
  return { text: value, type: 'bold' };
}

/**
 * Creates an inline code fragment.
 */
function code(value: string): HelpTextFragment {
  return { text: value, type: 'code' };
}

/**
 * Creates an inline link fragment.
 */
function link(label: string, href: string): HelpTextFragment {
  return { href, text: label, type: 'link' };
}

/**
 * Stores the ported Help content for the in-app Help view.
 */
export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Input File Format',
    titleLevel: 2,
    body: [
      [text('Melbourne expects an Excel spreadsheet with a specific structure.')],
      [
        text('The first row is the header row and is '),
        bold('required'),
        text('. The first six (or seven) columns must be present in the workbook, followed by one column per voter.'),
      ],
    ],
    items: [
      [
        bold('Draw'),
        text(
          ': Helper column for draw or placing values. Melbourne does not read these values, but the column must still be present.',
        ),
      ],
      [bold('Entry User/Country'), text(': User, country, or other entry owner.')],
      [
        bold('Flag Details'),
        text(': Flag reference for the entry. This can be left blank if you are not using flags.'),
      ],
      [bold('Entry Artist'), text(': Entry artist.')],
      [bold('Entry Song'), text(': Song title.')],
      [
        bold('Entry Points'),
        text(
          ': Helper column for total points. Melbourne does not read these values, but the column must still be present.',
        ),
      ],
      [
        bold('Count'),
        text(
          ': Helper column for the number of voters who voted for each entry. This is an optional column that can be omitted. If present, make sure to enable off the "Contest file contains ‘Count’ column" option.',
        ),
      ],
      [
        bold('Voters/Votes'),
        text(
          ': One voter column per voter, with the voter name in the header row and the awarded points in the matching entry row.',
        ),
      ],
    ],
  },
  {
    title: 'Notes',
    titleLevel: 3,
    items: [
      [
        text('If you need to disqualify an entry, use '),
        code('DQ'),
        text(
          ' in the relevant voter cell. The disqualified entry is then sorted after non-disqualified entries for that scoreboard and the remaining scoreboards.',
        ),
      ],
      [text('Even helper columns that are not actively read or populated must still be present in the sheet.')],
      [
        text(
          'Avoid leaving extra content in rows after the final entry, since that can be misread as another contest entry.',
        ),
      ],
      [text('You can view a sample contest file here: '), link('1988.xlsx', '/1988.xlsx'), text('.')],
    ],
  },
  {
    title: 'Flags',
    titleLevel: 3,
    body: [
      [
        text('Melbourne includes three bundled flag sets: '),
        code('ISC'),
        text(', '),
        code('World'),
        text(', and '),
        code('Rect'),
        text('. Use the format '),
        code('<flag set>/<flag file name>'),
        text(', such as '),
        code('ISC/Kaledonii.png'),
        text(' or '),
        code('World/ee.png'),
        text(' to reference flags in the contest file.'),
      ],
    ],
    items: [
      [bold('ISC'), text(': flags for Internatia Song Contest countries.')],
      [
        bold('World'),
        text(': square real-world country flags, named with lowercase two-letter ISO codes where applicable.'),
      ],
      [
        bold('Rect'),
        text(
          ': rectangular real-world country flags, also named with lowercase two-letter ISO codes where applicable.',
        ),
      ],
      [
        text(
          'Custom flags can be loaded and used when generating scoreboards. Select the flag files you wish to use in the Custom Flags Files input field. You can reference these custom flags using ',
        ),
        code('Custom/<flag file name>'),
        text(', such as '),
        code('Custom/A.png'),
        text('.'),
      ],
    ],
  },
  {
    title: 'Generating Scoreboards',
    titleLevel: 2,
    body: [[text('Once the contest workbook is prepared, fill out the form and generate the scoreboards.')]],
    items: [
      [text('Enter the contest title.')],
      [text('Choose the contest file. If the file contains the Count column, make sure to tick the checkbox.')],
      [text('Set the main and accent colors, or reset them to the defaults.')],
      [
        text(
          'Choose whether to display flags and whether to draw borders around them. If referencing custom flags in the contest file, select all referenced files to be loaded and used during scoreboard generation. If flags are enabled, the program validates that every referenced flag exists before generation starts.',
        ),
      ],
      [
        text('If using custom fonts, select both the base font and points font '),
        code('.ttf'),
        text('/'),
        code('.otf'),
        text(
          " files for the font(s) you wish to override. You do not need to specify both, and can only override one if you'd like. By default, the program uses Zilla Slab as the base and points font.",
        ),
      ],
      [text('When all required inputs are present, the '), bold('Generate'), text(' button becomes available.')],
      [
        text('Press '),
        bold('Generate'),
        text(' to begin rendering. While rendering is in progress, the button changes to '),
        bold('Cancel'),
        text(' so the job can be stopped.'),
      ],
      [text('Generation time varies by contest size, but should complete within a few seconds.')],
    ],
  },
];
