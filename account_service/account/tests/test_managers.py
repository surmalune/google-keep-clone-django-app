from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomUserManagerTest(TestCase):

    @classmethod
    def setUp(cls):
        cls.valid_user_data = {
            'email': 'testuser@example.com',
            'password': 'TestPassword123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        cls.valid_superuser_data = {
            'email': 'superuser@example.com',
            'password': 'SuperPassword123',
            'first_name': 'Admin',
            'last_name': 'Boss'
        }

    def test_create_user_success(self):
        user = User.objects.create_user(**self.valid_user_data)

        self.assertEqual(user.email, self.valid_user_data['email'])
        self.assertTrue(user.check_password(self.valid_user_data['password']))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='test')

    def test_create_user_with_normalized_email(self):
        email = 'testUSER@Example.COM'
        user = User.objects.create_user(
            email=email, password='test', first_name='John', last_name='Doe'
        )
        self.assertEqual(user.email, 'testUSER@example.com')

    def test_create_superuser_success(self):
        superuser = User.objects.create_superuser(**self.valid_superuser_data)

        self.assertEqual(superuser.email, self.valid_superuser_data['email'])
        self.assertTrue(superuser.check_password(
            self.valid_superuser_data['password']))
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_create_superuser_without_is_staff(self):
        self.valid_superuser_data['is_staff'] = False

        with self.assertRaises(ValueError):
            User.objects.create_superuser(**self.valid_superuser_data)

    def test_create_superuser_without_is_superuser(self):
        self.valid_superuser_data['is_superuser'] = False

        with self.assertRaises(ValueError):
            User.objects.create_superuser(**self.valid_superuser_data)
