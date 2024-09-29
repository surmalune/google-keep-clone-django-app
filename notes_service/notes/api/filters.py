from django_filters import FilterSet, MultipleChoiceFilter
from notes.models import Note, NoteStatus

class NoteFilterSet(FilterSet):
    status = MultipleChoiceFilter(
        choices=NoteStatus.choices,
        field_name='status',
    )

    class Meta:
        model = Note
        fields = ['status', 'user_id']