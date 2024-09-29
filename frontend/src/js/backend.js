const API_URL = process.env.API_URL;
const URL_NOTES_SERVICE = `${API_URL}/api/notes`;
const URL_AUTH_SERVICE = `${API_URL}/api/account`;

const expiresIn = 300000;

export class ListItem {
    constructor(id, text, order, is_checked = false) {
        this.id = id;
        this.text = text;
        this.order = order;
        this.is_checked = is_checked;
    }
}

export class Note {
    constructor(id, title, content, type, color, status = 'normal', list_items = [], image = null) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.type = type;
        this.color = color;
        this.status = status;
        this.list_items = list_items;
        this.image = image;
    }
}

export async function getAccessToken() {
    const token = localStorage.getItem('access');
    if (!token || token === 'undefined') {
        return null;
    }

    const expiry = localStorage.getItem('token_expiry');
    const now = new Date().getTime();

    if (expiry && now < expiry) {
        return token;
    } else {
        return await refreshToken();
    }
}

async function refreshToken() {
    const response = await fetch(`${URL_AUTH_SERVICE}/token/refresh/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: localStorage.getItem('refresh') })
    });

    if (!response.ok) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('token_expiry');
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    const access_token = data.access;
    const refresh_token = data.refresh;
    const expiryTime = new Date().getTime() + expiresIn;

    localStorage.setItem('token_expiry', expiryTime);
    localStorage.setItem('refresh', refresh_token);
    localStorage.setItem('access', access_token);

    return access_token;
}

export async function getUserInfo(token) {
    const response = await fetch(`${URL_AUTH_SERVICE}/user/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get user info');
    }

    return response.json();
}

export async function updateUser(token) {
    // TODO: настроить
    const payload = {
        first_name: 'Hello'
    }

    const response = await fetch(`${URL_AUTH_SERVICE}/user/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Failed to update user info');
    }

    return response.json();
}

async function getNotesFromServer(params, token) {
    let url = `${URL_NOTES_SERVICE}/notes/`;
    url += `?`;
    Object.keys(params).forEach(key => {
        params[key].forEach(value => {
            url += `${key}=${value}&`;
        });
    });

    const finalUrl = url.slice(0, -1);

    const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get notes from server');
    }

    const data = await response.json();
    console.log('DATA', data);
    return data.reverse();
}

export async function getDefaultNotesFromServer(token) {
    const params = {
        status: ["normal", "pinned"]
    };
    return getNotesFromServer(params, token);
}

export async function getArchivedNotesFromServer(token) {
    const params = {
        status: ["archived"]
    };
    return getNotesFromServer(params, token);
}

export async function getDeletedNotesFromServer(token) {
    const params = {
        status: ["deleted"]
    };
    return getNotesFromServer(params, token);
}

export async function deleteNoteOnServer(noteId, token) {
    console.log('deleteNoteOnServer');
    let response = await fetch(`${URL_NOTES_SERVICE}/notes/${noteId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete note on server');
    }

    return response;
}

export async function updateNoteOnServer(noteId, payload, token) {
    console.log('updateNoteOnServer');
    const formData = new FormData();

    if (payload.hasOwnProperty('color')) {
        formData.append('color', payload.color);
    }

    if (payload.hasOwnProperty('content')) {
        formData.append('content', payload.content);
    }

    if (payload.hasOwnProperty('status')) {
        formData.append('status', payload.status);
    }

    if (payload.hasOwnProperty('title')) {
        formData.append('title', payload.title);
    }

    if (payload.hasOwnProperty('image') && payload.image) {
        formData.append('image', payload.image);
    }

    if (payload.hasOwnProperty('list_items') && payload.list_items) {
        payload.list_items.forEach((item, index) => {
            formData.append(`list_items[${index}]id`, item.id);
            formData.append(`list_items[${index}]text`, item.text);
            formData.append(`list_items[${index}]order`, item.order);
            formData.append(`list_items[${index}]is_checked`, item.is_checked);
        });
    }

    const response = await fetch(`${URL_NOTES_SERVICE}/notes/${noteId}/`, {
        method: 'PATCH',
        body: formData,
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to update note on server');
    }

    return response.json();
}

export async function archiveNote(noteId, isArchived, token) {
    const payload = {
        status: isArchived ? 'archived' : 'normal'
    };

    return updateNoteOnServer(noteId, payload, token);
}

export async function moveToTrashNote(noteId, token) {
    const payload = {
        status: 'deleted'
    };

    return updateNoteOnServer(noteId, payload, token);
}

export async function restoreNote(noteId, token) {
    const payload = {
        status: 'archived'
    };

    return updateNoteOnServer(noteId, payload, token);
}

export async function searchNotes(searchText, token) {
    const search = encodeURIComponent(searchText);
    const url = `${URL_NOTES_SERVICE}/notes/?search=${search}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to search notes on server');
    }

    const data = await response.json();

    return data;
}

export async function loginUser(email, password) {
    const response = await fetch(`${URL_AUTH_SERVICE}/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errors = await response.json();
        throw errors.detail;
    }

    const data = await response.json();

    if (data.access) {
        const expiryTime = new Date().getTime() + expiresIn;
        localStorage.setItem('token_expiry', expiryTime);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('access', data.access);
    }

    return data;
}

export async function registerUser(userData) {
    const response = await fetch(`${URL_AUTH_SERVICE}/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const errors = await response.json();
        throw errors.detail;
    }

    return response.json();
}

export async function createNote(payload, token) {
    const formData = new FormData();
    formData.append('color', payload.color);
    formData.append('content', payload.content);
    formData.append('title', payload.title);

    if (payload.image) {
        formData.append('image', payload.image);
    }

    if (payload.list_items) {
        payload.list_items.forEach((item, index) => {
            formData.append(`list_items[${index}]text`, item.text);
            formData.append(`list_items[${index}]order`, item.order);
            formData.append(`list_items[${index}]is_checked`, item.is_checked);
        });
    }

    const response = await fetch(`${URL_NOTES_SERVICE}/notes/`, {
        method: "POST",
        body: formData,
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        throw new Error('Failed to create note on server');
    }

    return response.json();
}

export async function fetchImage(url, token) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function checkIfEmailExistsAlready(email) {
    const response = await fetch(`${URL_AUTH_SERVICE}/email/?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to check if email already exists');
    }

    return response.json();
}

export async function updateCheckbox(itemId, payload, token) {
    const response = await fetch(`${URL_NOTES_SERVICE}/list-items/${itemId}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to update checkbox on server');
    }

    return response.json();
}

export async function deleteImage(noteId, token) {
    console.log('deleteImage');

    const response = await fetch(`${URL_NOTES_SERVICE}/notes/${noteId}/image/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete image on server');
    }

    return response;
}