from typing import Optional, Tuple, List
from zipfile import ZipFile, ZIP_DEFLATED
import uuid
import os
from melbourne.contest.contest import Contest


def validate_flags(
    contest: Contest, flags_dir: str, custom_flags_dir: Optional[str] = None
) -> Tuple[bool, List[str]]:
    invalid_flags = []
    all_flags_valid = True
    for entry in contest.entries:
        if os.path.exists(os.path.join(flags_dir, entry.flag)) or (
            custom_flags_dir
            and os.path.exists(os.path.join(custom_flags_dir, entry.flag))
        ):
            continue
        else:
            all_flags_valid = False
            invalid_flags.append(entry.flag)
    return all_flags_valid, invalid_flags


def zip_scoreboards(images: List[str], working_dir: str) -> str:
    zip_file_name = f"{uuid.uuid4().hex}.zip"
    zip_file_path = os.path.join(working_dir, zip_file_name)
    with ZipFile(zip_file_path, mode="w", compression=ZIP_DEFLATED) as z:
        for img_file_path in images:
            z.write(img_file_path, os.path.basename(img_file_path))
    return zip_file_name


def upload_scoreboard_zip(zip_file: str) -> str:
    pass
