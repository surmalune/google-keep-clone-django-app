from rest_framework.serializers import ValidationError


def validate_note_content_and_items(content: str, list_items: list) -> None:
    if content and list_items:
        raise ValidationError(
            "Note cannot have both content and list_items at the same time."
        )
