# Melbourne

## Usage

### Command Line

```bash
uv run python -m uvicorn melbourne.api:app --port 1273 --log-config log_config.json
```

### Environment File

The following values should be set in the `.env` file:

* `WORKING_DIR`: Directory where the temporary files should be created
* `FLAGS_DIR`: Root directory for available flags
* `BASE_FONT_PATH`: Path to font file for most text elements in the scoreboard
* `PTS_FONT_PATH`: Path to font file for the points display (this can be the same as `BASE_FONT_PATH`)
* `VALID_API_KEY`: Should be specified in the `Melbourne-API-Key` header for the request to be accepted
* `UPLOAD_ZIP_FILES`: Boolean value on whether the zip files should be uploaded to Cloudflare R2

If uploading to Cloudflare R2, the following values should also be set: `R2_ACCOUNT_ID`, `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
