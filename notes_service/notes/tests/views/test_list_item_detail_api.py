from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from notes.models import ListItem, Note


class ListItemDetailApiTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_id = 1
        cls.other_user_id = 2
        cls.note = Note.objects.create(
            title='Test Note',
            content='This is a test note.',
            user_id=cls.user_id
        )
        cls.list_item = ListItem.objects.create(
            text='Test List Item',
            is_checked=False,
            note=cls.note
        )
        cls.url = reverse('list-items', kwargs={'pk': cls.list_item.id})

    def test_patch_list_item_success(self):
        data = {
            'text': 'Updated List Item',
            'is_checked': True
        }
        response = self.client.patch(self.url + '?user_id={}'.format(self.user_id), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], data['text'])
        self.assertEqual(response.data['is_checked'], data['is_checked'])

    def test_patch_list_item_invalid_data(self):
        data = {
            'text': None,
        }
        response = self.client.patch(self.url + '?user_id={}'.format(self.user_id), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_list_item_forbidden(self):
        data = {
            'text': 'Attempted Update',
            'is_checked': True
        }
        response = self.client.patch(self.url + '?user_id={}'.format(self.other_user_id), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_list_item_unauthenticated(self):
        data = {
            'text': 'Unauthenticated Update',
            'is_checked': True
        }
        response = self.client.patch(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
