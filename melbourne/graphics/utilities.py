from enum import Enum, auto
from pathlib import Path

import webcolors
from cachetools import TTLCache, cached
from skia import (
    Canvas,
    Color,
    FilterQuality,
    Font,
    Image,
    Paint,
    Rect,
    TextBlob,
)


def get_text_width_height(font: Font, text: str) -> tuple[float, float]:
    """Get the width and height for a text, using the font for metric calculations"""
    width = font.measureText(text)
    height = font.getSpacing()
    return width, height


def hex_to_rgb(hex: str) -> Color:
    """Convert a color from HEX representation to RGB (in Skia.Color)"""
    rgb = webcolors.hex_to_rgb(hex)
    return Color(rgb.red, rgb.green, rgb.blue)


def draw_rectangle(
    canvas: Canvas,
    point: tuple[int, int],
    width: int,
    height: int,
    # Technically, skia.Color is just an int
    fill_color: int | None = None,
    stroke_color: int | None = None,
    stroke_width: float | None = None,
) -> None:
    """Draw a rectangle, which is optionally filled in, or has a border"""
    x, y = point
    rect = Rect(x, y, x + width, y + height)

    if fill_color:
        paint = Paint(AntiAlias=True, Color=fill_color, Style=Paint.Style.kFill_Style)
        canvas.drawRect(rect, paint)

    if stroke_color and stroke_width:
        paint = Paint(
            AntiAlias=True,
            Color=stroke_color,
            Style=Paint.Style.kStroke_Style,
            StrokeWidth=stroke_width,
        )
        canvas.drawRect(rect, paint)


class TextAlignment(Enum):
    LEFT = auto()
    CENTER = auto()


def draw_text(
    canvas: Canvas,
    point: tuple[float, float],
    text: str,
    font: Font,
    color: Color,
    alignment: TextAlignment = TextAlignment.LEFT,
) -> None:
    """Draw text using the defined font and color"""
    x, y = point
    blob = TextBlob(text, font)
    paint = Paint(AntiAlias=True, Color=color)

    if alignment == TextAlignment.CENTER:
        # Horizontally center the text around x
        width = font.measureText(text)
        x -= width / 2.0

    # Vertically center the text around y
    metrics = font.getMetrics()
    y -= (metrics.fAscent + metrics.fDescent) / 2.0

    canvas.drawTextBlob(blob, x, y, paint)


def draw_line(
    canvas: Canvas,
    starting_point: tuple[float, float],
    ending_point: tuple[float, float],
    color: Color,
    stroke_width: float,
) -> None:
    """Draw a line with the specified color and stroke width"""
    x0, y0 = starting_point
    x1, y1 = ending_point
    paint = Paint(
        AntiAlias=True,
        Color=color,
        StrokeWidth=stroke_width,
        Style=Paint.Style.kStroke_Style,
    )
    canvas.drawLine(x0, y0, x1, y1, paint)


@cached(cache=TTLCache(ttl=60, maxsize=1024))
def load_image(file_path: Path, width: float) -> Image:
    """Load an image. The image is cached for 60 seconds so that subsequent load attempts for the current scoreboard are cached."""
    with open(file_path, "rb") as f:
        data = f.read()
    image = Image.MakeFromEncoded(data)

    orig_width = image.width()
    orig_height = image.height()
    aspect_ratio = orig_height / orig_width
    height = int(width * aspect_ratio)

    resized_image = image.resize(
        int(width),
        int(height),
        FilterQuality.kHigh_FilterQuality,
    )
    return resized_image


def draw_image(
    canvas: Canvas,
    image: Image,
    x: float,
    y: float,
    stroke_color: int | None = None,
    stroke_width: float | None = None,
):
    """Draw an image, with an optional border"""
    if not (stroke_color and stroke_width):
        canvas.drawImage(image, x, y)
    else:
        # Draw the image centered within the border
        src_rect = Rect.MakeWH(image.width(), image.height())
        dst_rect = Rect.MakeXYWH(x, y, image.width(), image.height())
        canvas.drawImageRect(image, src_rect, dst_rect)

        # Draw the border for the image
        paint = Paint(
            AntiAlias=True,
            Color=stroke_color,
            Style=Paint.Style.kStroke_Style,
            StrokeWidth=stroke_width,
        )
        border_rect = Rect.MakeXYWH(
            x,
            y,
            image.width(),
            image.height(),
        )
        canvas.drawRect(border_rect, paint)
