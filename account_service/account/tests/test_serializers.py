from django.test import TestCase
from django.contrib.auth import get_user_model

from account.services import UserService

from ..api.serializers import UserCreateSerializer, UserUpdateSerializer

User = get_user_model()


class UserCreateSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.valid_data = {
            'email': 'testuser@example.com',
            'password': 'securepassword123',
            'password2': 'securepassword123',
            'first_name': 'John',
            'last_name': 'Doe',
        }

        cls.user = User.objects.create_user(
            email='existing@example.com',
            password='securepassword123'
        )

    def test_valid_user_create(self):
        serializer = UserCreateSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        user = UserService.create(serializer.validated_data)

        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.check_password('securepassword123'))

    def test_invalid_password_mismatch(self):
        invalid_password_data = {
            'email': 'testuser@example.com',
            'password': 'securepassword123',
            'password2': 'wrongpassword',
            'first_name': 'John',
            'last_name': 'Doe',
        }

        serializer = UserCreateSerializer(data=invalid_password_data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
        self.assertEqual(
            serializer.errors['password'][0], "Password fields didn't match.")

    def test_duplicate_email(self):
        duplicate_email_data = self.valid_data.copy()
        duplicate_email_data['email'] = 'existing@example.com'

        serializer = UserCreateSerializer(data=duplicate_email_data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertEqual(
            serializer.errors['email'][0], 'This field must be unique.')

    def test_password_validation_error(self):
        weak_password_data = self.valid_data.copy()
        weak_password_data['password'] = '123'
        weak_password_data['password2'] = '123'

        serializer = UserCreateSerializer(data=weak_password_data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class UserSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='testuser@example.com',
            password='securepassword123',
            first_name='John',
            last_name='Doe',
        )

    def test_valid_user_update(self):
        valid_update_data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
        }

        serializer = UserUpdateSerializer(
            instance=self.user, data=valid_update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = UserService.update(self.user, serializer.validated_data)

        self.assertEqual(updated_user.first_name, 'Jane')
        self.assertEqual(updated_user.last_name, 'Smith')

    def test_password_mismatch(self):
        password_mismatch_data = {
            'password': 'newpassword123',
            'password2': 'wrongpassword',
        }

        serializer = UserUpdateSerializer(
            instance=self.user, data=password_mismatch_data, partial=True)

        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_update(self):
        password_update_data = {
            'password': 'newpassword123',
            'password2': 'newpassword123',
        }

        serializer = UserUpdateSerializer(
            instance=self.user, data=password_update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = UserService.update(self.user, serializer.validated_data)

        self.assertTrue(updated_user.check_password('newpassword123'))

    def test_missing_password_confirmation(self):
        missing_password2_data = {'password': 'newpassword123'}

        serializer = UserUpdateSerializer(
            instance=self.user, data=missing_password2_data, partial=True)

        self.assertFalse(serializer.is_valid())
        self.assertIn('password2', serializer.errors)
        self.assertEqual(
            serializer.errors['password2'][0], 'Password confirmation is required.')

    def test_partial_update_no_password(self):
        partial_data = {'first_name': 'Jane'}

        serializer = UserUpdateSerializer(
            instance=self.user, data=partial_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = UserService.update(self.user, serializer.validated_data)

        self.assertEqual(updated_user.first_name, 'Jane')
        self.assertTrue(updated_user.check_password('securepassword123'))
