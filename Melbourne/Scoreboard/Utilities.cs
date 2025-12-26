namespace Melbourne.Scoreboard;

using System;
using System.IO;
using Microsoft.Extensions.Caching.Memory;
using SkiaSharp;

public static class Utilities
{
    /* -------------------------------------------------------------
     * Text helpers
     * ------------------------------------------------------------- */

    public static (float Width, float Height) GetTextWidthHeight(
        SKFont font,
        string text)
    {
        var width = font.MeasureText(text);
        var height = font.Spacing;
        return (width, height);
    }

    /* -------------------------------------------------------------
     * Color helpers
     * ------------------------------------------------------------- */

    public static SKColor HexToRgb(string hex)
    {
        if (hex.StartsWith("#"))
        {
            hex = hex[1..];
        }

        var r = Convert.ToByte(hex[..2], 16);
        var g = Convert.ToByte(hex.Substring(2, 2), 16);
        var b = Convert.ToByte(hex.Substring(4, 2), 16);

        return new SKColor(r, g, b);
    }

    /* -------------------------------------------------------------
     * Drawing helpers
     * ------------------------------------------------------------- */

    public static void DrawRectangle(
        SKCanvas canvas,
        (float X, float Y) point,
        float width,
        float height,
        SKColor? fillColor = null,
        SKColor? strokeColor = null,
        float? strokeWidth = null)
    {
        var rect = new SKRect(
            point.X,
            point.Y,
            point.X + width,
            point.Y + height);

        if (fillColor.HasValue)
        {
            using var paint = new SKPaint
            {
                IsAntialias = true,
                Color = fillColor.Value,
                Style = SKPaintStyle.Fill
            };

            canvas.DrawRect(rect, paint);
        }

        if (strokeColor.HasValue && strokeWidth.HasValue)
        {
            using var paint = new SKPaint
            {
                IsAntialias = true,
                Color = strokeColor.Value,
                Style = SKPaintStyle.Stroke,
                StrokeWidth = strokeWidth.Value
            };

            canvas.DrawRect(rect, paint);
        }
    }

    public enum TextAlignment
    {
        Left,
        Center
    }

    public static void DrawText(
        SKCanvas canvas,
        (float X, float Y) point,
        string text,
        SKFont font,
        SKColor color,
        TextAlignment alignment = TextAlignment.Left)
    {
        using var paint = new SKPaint
        {
            IsAntialias = true,
            Color = color
        };

        var x = point.X;
        var y = point.Y;

        if (alignment == TextAlignment.Center)
        {
            var width = font.MeasureText(text);
            x -= width / 2f;
        }

        font.GetFontMetrics(out var metrics);
        y -= (metrics.Ascent + metrics.Descent) / 2f;

        canvas.DrawText(text, x, y, font, paint);
    }

    public static void DrawLine(
        SKCanvas canvas,
        (float X, float Y) start,
        (float X, float Y) end,
        SKColor color,
        float strokeWidth)
    {
        using var paint = new SKPaint
        {
            IsAntialias = true,
            Color = color,
            StrokeWidth = strokeWidth,
            Style = SKPaintStyle.Stroke
        };

        canvas.DrawLine(start.X, start.Y, end.X, end.Y, paint);
    }

    public static void DrawImage(
        SKCanvas canvas,
        SKBitmap image,
        float x,
        float y,
        SKColor? strokeColor = null,
        float? strokeWidth = null)
    {
        if (!(strokeColor.HasValue && strokeWidth.HasValue))
        {
            canvas.DrawBitmap(image, x, y);
            return;
        }

        var rect = new SKRect(
            x,
            y,
            x + image.Width,
            y + image.Height);

        using var paint = new SKPaint
        {
            IsAntialias = true,
            Color = strokeColor.Value,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = strokeWidth.Value
        };

        canvas.DrawBitmap(image, rect, paint);
        canvas.DrawRect(rect, paint);
    }

    /* -------------------------------------------------------------
     * Image helpers
     * ------------------------------------------------------------- */

    public static SKBitmap LoadImage(
        string filePath,
        float width)
    {
        using var stream = File.OpenRead(filePath);
        using var original = SKBitmap.Decode(stream);

        var aspectRatio = (float)original.Height / original.Width;
        var newHeight = (int)(width * aspectRatio);
        var info = new SKImageInfo((int)width, newHeight);

        var resized = new SKBitmap(info);
        var sampling = new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear);
        original.ScalePixels(resized, sampling);
        return resized;
    }
}