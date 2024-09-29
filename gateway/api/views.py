import logging
import requests
from django.http import HttpResponse
from collections import defaultdict
from config.settings import ACCOUNT_SERVICE_URL, NOTES_SERVICE_URL

logger = logging.getLogger('gateway')


def proxy_to_account_service(request, path):
    url = f'{ACCOUNT_SERVICE_URL}/{path}'
    headers = {key: value for key, value in request.headers.items()
               if key != 'Host'}
    response = requests.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.body,
        params=request.GET,
    )
    return HttpResponse(response.content, status=response.status_code, content_type=response.headers.get('Content-Type'))


def proxy_to_notes_service(request, path):
    url = f'{NOTES_SERVICE_URL}/{path}'
    headers = {key: value for key, value in request.headers.items()
               if key != 'Host'}

    user_id = getattr(request, 'user_id', None)
    params = request.GET.copy()
    if user_id:
        params['user_id'] = user_id

    params_dict = defaultdict(list)
    for key, value in params.lists():
        params_dict[key].extend(value)

    response = requests.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.body,
        params=params_dict,
    )
    return HttpResponse(response.content, status=response.status_code, content_type=response.headers.get('Content-Type'))
