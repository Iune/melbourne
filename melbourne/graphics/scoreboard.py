import logging
from multiprocessing.pool import ThreadPool
from pathlib import Path

from pathvalidate import sanitize_filename
from skia import Surface

from melbourne.graphics.config import (
    ScoreboardColors,
    ScoreboardConfig,
    ScoreboardFonts,
    ScoreboardSizes,
    load_fonts,
)
from melbourne.graphics.utilities import (
    TextAlignment,
    draw_image,
    draw_line,
    draw_rectangle,
    draw_text,
    load_image,
)

logger = logging.getLogger(__name__)


def _generate_scoreboard(
    config: ScoreboardConfig,
    fonts: ScoreboardFonts,
    colors: ScoreboardColors,
    voter_idx: int,
):
    """Generate a single scoreboard"""
    sizes = ScoreboardSizes(fonts, config, voter_idx)
    surface = Surface.MakeRasterN32Premul(sizes.width, sizes.height)
    canvas = surface.getCanvas()

    # Draw scoreboard background
    canvas.clear(colors.background)

    # Draw voter details
    draw_rectangle(
        canvas,
        (0, 0),
        sizes.width,
        30.0 * sizes.scaling_ratio,
        colors.voter_header,
    )
    draw_text(
        canvas,
        point=(10.0 * sizes.scaling_ratio, 15.0 * sizes.scaling_ratio),
        text=f"Now Voting: {config.contest.voter_names[voter_idx]} ({voter_idx + 1}/{config.contest.num_voters})",
        font=fonts.voter_header,
        color=colors.voter_header_text,
        alignment=TextAlignment.LEFT,
    )

    # Draw contest title
    draw_rectangle(
        canvas,
        (0, 30 * sizes.scaling_ratio),
        sizes.width,
        30.0 * sizes.scaling_ratio,
        colors.contest_header,
    )
    draw_text(
        canvas,
        point=(10.0 * sizes.scaling_ratio, 45.0 * sizes.scaling_ratio),
        text=(
            f"{config.title} Results"
            if config.append_results_to_title
            else config.title
        ),
        font=fonts.contest_header,
        color=colors.contest_header_text,
        alignment=TextAlignment.LEFT,
    )

    # Draw background rectangles for entry details
    num_left_col_entries = (
        int(config.contest.num_entries / 2) + config.contest.num_entries % 2
    )
    num_right_col_entries = config.contest.num_entries - num_left_col_entries
    draw_rectangle(
        canvas,
        point=(10 * sizes.scaling_ratio, 70 * sizes.scaling_ratio),
        width=sizes.rectangle,
        height=35 * sizes.scaling_ratio * num_left_col_entries,
        fill_color=colors.entry_details,
        stroke_width=2.0,
        stroke_color=colors.entry_details_border,
    )
    draw_rectangle(
        canvas,
        point=(
            20.0 * sizes.scaling_ratio + sizes.rectangle,
            70.0 * sizes.scaling_ratio,
        ),
        width=sizes.rectangle,
        height=35.0 * sizes.scaling_ratio * num_right_col_entries,
        fill_color=colors.entry_details,
        stroke_width=2.0,
        stroke_color=colors.entry_details_border,
    )

    # Draw entry details
    entries = config.contest.get_results_after_voter(voter_idx)
    for i, entry in enumerate(entries):
        if i < num_left_col_entries:
            x_offset = 0.0
            y_offset = i
        else:
            x_offset = 10.0 * sizes.scaling_ratio + sizes.rectangle
            y_offset = i - num_left_col_entries

        # Draw the entry's country flag
        if config.display_flags:
            if config.custom_flags_dir and entry.flag.lower().startswith("custom/"):
                flag = entry.flag.split("/", maxsplit=1)[-1]
                flag_path = config.custom_flags_dir / flag
            else:
                flag_path = config.flags_dir / Path(entry.flag)

            if not flag_path.exists():
                logger.warning(f"Could not find flag at {flag_path=}")
            else:
                # Load the flag and scale width to 20.0 * scaling
                flag = load_image(flag_path, width=20.0 * sizes.scaling_ratio)

                if config.display_flag_borders:
                    x = 27.0 * sizes.scaling_ratio - flag.width() / 2.0 + x_offset
                    y = (
                        87.0 * sizes.scaling_ratio
                        - flag.height() / 2.0
                        + 35.0 * sizes.scaling_ratio * y_offset
                    )
                    draw_image(
                        canvas,
                        flag,
                        x,
                        y,
                        stroke_width=1,
                        stroke_color=colors.flag_border,
                    )

        # Draw entry details
        draw_text(
            canvas,
            point=(
                20.0 * sizes.scaling_ratio + x_offset + sizes.flag_offset,
                80.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            text=entry.country,
            font=fonts.country,
            color=colors.country_text,
            alignment=TextAlignment.LEFT,
        )
        draw_text(
            canvas,
            point=(
                20.0 * sizes.scaling_ratio + x_offset + sizes.flag_offset,
                94.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            text=f"{entry.artist} – {entry.song}",
            font=fonts.entry_details,
            color=colors.entry_details_text,
            alignment=TextAlignment.LEFT,
        )

        # Draw the entry's total number of received points
        total_pts_color = (
            colors.dqed_pts if entry.dq_statuses[voter_idx] else colors.total_pts
        )
        total_pts_text_color = (
            colors.dqed_pts_text
            if entry.dq_statuses[voter_idx]
            else colors.total_pts_text
        )
        draw_rectangle(
            canvas,
            point=(
                30.0 * sizes.scaling_ratio
                + x_offset
                + sizes.flag_offset
                + sizes.entry_details,
                77.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            width=29.0 * sizes.scaling_ratio,
            height=20.0 * sizes.scaling_ratio,
            fill_color=total_pts_color,
        )
        draw_text(
            canvas,
            point=(
                44.5 * sizes.scaling_ratio
                + x_offset
                + sizes.flag_offset
                + sizes.entry_details,
                87.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            text=str(entry.display_pts[voter_idx]),
            font=fonts.total_pts,
            color=total_pts_text_color,
            alignment=TextAlignment.CENTER,
        )

        # Draw the entry's points received by the current voter
        if len(entry.votes[voter_idx]) > 0:
            draw_rectangle(
                canvas,
                point=(
                    59.0 * sizes.scaling_ratio
                    + x_offset
                    + sizes.flag_offset
                    + sizes.entry_details,
                    77.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
                ),
                width=24.0 * sizes.scaling_ratio,
                height=20.0 * sizes.scaling_ratio,
                fill_color=colors.received_pts,
            )
            if entry.votes[voter_idx].endswith(".0"):
                received_votes_text = str(int(float(entry.votes[voter_idx])))
            else:
                received_votes_text = entry.votes[voter_idx]
            draw_text(
                canvas,
                point=(
                    71.0 * sizes.scaling_ratio
                    + x_offset
                    + sizes.flag_offset
                    + sizes.entry_details,
                    87.0 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
                ),
                text=received_votes_text,
                font=fonts.received_pts,
                color=colors.received_pts_text,
                alignment=TextAlignment.CENTER,
            )

        # Draw a dividing line between entries
        draw_line(
            canvas,
            starting_point=(
                10.0 * sizes.scaling_ratio + x_offset,
                104.5 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            ending_point=(
                10.0 * sizes.scaling_ratio + x_offset + sizes.rectangle,
                104.5 * sizes.scaling_ratio + 35.0 * sizes.scaling_ratio * y_offset,
            ),
            color=colors.divider_line,
            stroke_width=0.5 * sizes.scaling_ratio,
        )

    # Save image to file
    image = surface.makeImageSnapshot()
    image_file_path = config.output_dir / sanitize_filename(
        f"{voter_idx + 1} - {config.contest.voter_names[voter_idx]}.png"
    )
    image.save(str(image_file_path))


def generate_scoreboards(config: ScoreboardConfig):
    """Generate scoreboards for the contest"""
    fonts = load_fonts(config.fonts_config)
    colors = ScoreboardColors(config.main_color, config.accent_color)

    inputs = [(config, fonts, colors, i) for i in range(config.contest.num_voters)]
    with ThreadPool(processes=5) as pool:
        pool.starmap(_generate_scoreboard, inputs)
