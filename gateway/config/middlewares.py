import logging
import requests
from .settings import ACCOUNT_SERVICE_URL
from django.core.cache import cache
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger('gateway')


class TokenVerificationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger.debug("request to %s", request.path)

        if 'api/account' in request.path:
            return self.get_response(request)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.error(
                'Authorization header missing or invalid.', exc_info=True)
            raise AuthenticationFailed(
                'Authorization header missing or invalid')

        token = auth_header.split(' ')[1]

        try:
            user_id = cache.get(token)
        except Exception as e:
            logger.error("Unexpected error with cache: %s", str(e))
            user_id = None

        if user_id:
            logger.info('Token found in cache for user_id: %s', user_id)
            request.user_id = user_id
        else:
            verification_response = self.verify_token(token)

            if verification_response.status_code != 200:
                logger.error(
                    'Invalid token response: %s', verification_response.status_code, exc_info=True)
                raise AuthenticationFailed('Invalid token')

            user_data = self.get_user_info(token)
            if not user_data:
                logger.error(
                    'Failed to retrieve user data from the authentication service.', exc_info=True)
                raise AuthenticationFailed('Failed to retrieve user data')

            user_id = user_data.get('user_id')
            logger.info('Successfully retrieved user data: %s', user_data)

            try:
                cache.set(token, user_id)
            except Exception as e:
                logger.error("Unexpected error with cache: %s", str(e))
            request.user_id = user_id

        return self.get_response(request)

    def verify_token(self, token):
        verify_token_url = f'{ACCOUNT_SERVICE_URL}/token/verify/'
        try:
            response = requests.post(verify_token_url, data={'token': token})
            logger.debug(
                'Verify token response: %s %s', response.status_code, response.text)
        except requests.RequestException as e:
            logger.error(
                'Error during token verification: %s', str(e), exc_info=True)
            raise AuthenticationFailed('Error during token verification')

        return response

    def get_user_info(self, token):
        user_info_url = f'{ACCOUNT_SERVICE_URL}/user/'
        try:
            response = requests.get(user_info_url, headers={
                                    'Authorization': f'Bearer {token}'})
            logger.debug(
                'Get user info response: %s %s', response.status_code, response.text)
            if response.status_code == 200:
                return response.json()
        except requests.RequestException as e:
            logger.error('Error retrieving user info: %s',
                         str(e), exc_info=True)
        return None
