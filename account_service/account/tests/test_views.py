import json
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model

from ..api.views import RegisterView, check_email_exists

User = get_user_model()


class RegisterViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.factory = APIRequestFactory()
        cls.register_url = reverse('register_user')

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_register_user_success(self, mock_info, mock_debug):
        data = {
            'email': 'testuser@example.com',
            'password': 'securepassword123',
            'password2': 'securepassword123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        request = self.factory.post(self.register_url, data, format='json')
        response = RegisterView.as_view()(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(json.loads(response.content), {
                         'email': 'testuser@example.com',
                         'first_name': 'John',
                         'last_name': 'Doe'})
        self.assertTrue(User.objects.filter(
            email='testuser@example.com').exists())
        mock_debug.assert_any_call('Received registration request')
        mock_info.assert_called_with(
            'User created with email: %s', 'testuser@example.com')

    @patch('account.api.views.logger.debug')
    def test_register_user_invalid_data(self, mock_debug):
        data = {'email': 'invalidemail'}
        request = self.factory.post(self.register_url, data, format='json')
        response = RegisterView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_debug.assert_called_with('Received registration request')

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_register_user_missing_fields(self, mock_info, mock_debug):
        data = {'email': 'testuser@example.com'}
        request = self.factory.post(self.register_url, data, format='json')
        response = RegisterView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_debug.assert_called_with('Received registration request')
        mock_info.assert_not_called()


class UserViewTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            password='securepassword123',
        )
        self.client.force_authenticate(user=self.user)

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_get_user_info(self, mock_info, mock_debug):
        url = reverse('user_info')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {
            'user_id': self.user.id,
            'email': 'user@example.com',
            'first_name': '',
            'last_name': ''
        })
        mock_debug.assert_called_with('Received user info request')
        mock_info.assert_called_with(
            'User info retrieved successfully for user ID: %s', self.user.id)

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_patch_user_info_success(self, mock_info, mock_debug):
        url = reverse('user_info')
        data = {'first_name': 'John', 'last_name': 'Doe'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'John')
        self.assertEqual(self.user.last_name, 'Doe')
        mock_debug.assert_any_call('Received user info update request')
        mock_info.assert_called_with(
            'User info updated successfully for user ID: %s', self.user.id)

    @patch('account.api.views.logger.debug')
    def test_patch_user_info_invalid_data(self, mock_debug):
        url = reverse('user_info')
        data = {'email': 'invalidemail'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_debug.assert_called_with('Received user info update request')


class CheckEmailExistsTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.factory = APIRequestFactory()
        cls.check_email_url = reverse('check_email_exists')
        cls.user = User.objects.create_user(
            email='checkemail@example.com', password='securepassword123')

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_check_email_exists_success(self, mock_info, mock_debug):
        request = self.factory.get(self.check_email_url, {
                                   'email': 'checkemail@example.com'})
        response = check_email_exists(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content), {'exists': True})
        mock_debug.assert_called_with('Received check email exists request')
        mock_info.assert_called_with(
            'Email existence check result for %s: %s', 'checkemail@example.com', True)

    @patch('account.api.views.logger.debug')
    def test_check_email_exists_no_email(self, mock_debug):
        request = self.factory.get(self.check_email_url)
        response = check_email_exists(request)
        response.render()
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content), {
                         'detail': 'Email not provided'})
        mock_debug.assert_called_with('Received check email exists request')

    @patch('account.api.views.logger.debug')
    @patch('account.api.views.logger.info')
    def test_check_email_exists_email_not_found(self, mock_info, mock_debug):
        request = self.factory.get(self.check_email_url, {
                                   'email': 'nonexistent@example.com'})
        response = check_email_exists(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content), {'exists': False})
        mock_debug.assert_called_with('Received check email exists request')
        mock_info.assert_called_with(
            'Email existence check result for %s: %s', 'nonexistent@example.com', False)
