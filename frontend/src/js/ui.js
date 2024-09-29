
import { getArchivedNotesFromServer, getDeletedNotesFromServer, getDefaultNotesFromServer } from './backend.js';
import { fillSelectToolbar } from './ui/selection.js';
import { fillNotesContainer, coverNotesContainer } from './ui/note.js';
import { getTokenOrCoverContainer } from './ui/auth.js';

export const state = {
    selectedCount : 0,
    selectedNotes : [],
    isNoteInputUnfolded : false,
    isMenuOpen : false,
    isSettingMenuOpen : false,
    isNoteModificationMode : false,
    isSettingWindowOpen : false,
    offsetMenuWidth : 80,
    currentNote : null,
    isOneNoteInRow : false,
    isListItemsAddMode: false
};

export let dom = {};

export function initUI() {
    dom = {
        btnClearSearch : document.getElementById('search-clear'),
        formSearch : document.getElementById('search-form'),
        searchContainer : document.querySelector('.search-input-wrapper'),
        btnClearSelection : document.getElementById('btn-clear-selection'),
        btnMenuToggle : document.getElementById('menu-toggle'),
        sidebarNav : document.querySelector('.sidebar-navigation'),
        sideBar : document.querySelector('.sidebar'),
        inputSearch : document.querySelector('.search-input'),
        btnEnterSearch : document.getElementById('search-enter'),
        btnViewToggle : document.getElementById('btn-view-toggle'),
        btnSettings : document.getElementById('btn-settings'),
        btnLogin : document.getElementById('btn-login'),
        userAccount : document.querySelector('.user-account'),
        textSelection : document.querySelector('.select-text'),
        notesCatalog : document.querySelector('.catalog'),
        pinnedText : document.getElementById('pinned-text'),
        othersText : document.getElementById('others-text'),
        imagesContainer : document.querySelector('.images-container'),
        overlay : document.querySelector('.overlay'),
        noteEditContainer : document.querySelector('.note-edit-container'),
        noteCreate : document.getElementById('create-note'),
        notesContainer : document.getElementById('notes-container'),
        messageNoContent : document.querySelector('.no-content-message'),
        messageTrash : document.querySelector('.trash-message'),
        iconNoContent : document.querySelector('.no-content-icon'),
        textNoContent : document.querySelector('.no-content-text'),
        btnEmptyTrash : document.querySelector('.btn-empty-trash'),
        btnMenuNotes : document.getElementById('btn-notes-menu'),
        btnMenuArchive : document.getElementById('btn-archive-menu'),
        btnMenuTrash : document.getElementById('btn-trash-menu'),
        headerSelection : document.querySelector('.selection-header'),
        inputTitleCreate : document.getElementById('title-input'),
        btnSubmitCreate : document.getElementById('btn-submit'),
        btnBackgroundCreate : document.getElementById('edit-background-color'),
        inputNoteCreate : document.getElementById('note-input'),
        inputGroupCreate : document.getElementById('input-group'),
        btnListCreate : document.getElementById('add-list-icon'),
        btnImageCreate : document.getElementById('add-image-note-icon'),
        actionsNoteCreate : document.getElementById('note-actions'),
        formNoteCreate : document.getElementById('note-form'),
        checkboxesContainer : document.getElementById('note-form').querySelector('.checkboxes-container')
    };

    loadDisplayMode();
    loadTheme();
    updateContentUIFromHash(); // TODO: хэштэги 'note', 'list'
}

export function createElement(tag, className, textContent = '', attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = textContent;

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

export function createIcon(className, title, eventHandler) {
    const icon = document.createElement('i');
    icon.className = className;
    icon.title = title;
    if (eventHandler) {
        icon.addEventListener('click', eventHandler);
    }
    return icon;
}

export function createButton(buttonId, iconClass, title) {
    const button = document.createElement('div');
    button.setAttribute('role', 'button');
    button.className = `btn-selection`;
    button.id = `${buttonId}`;
    button.title = title;

    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconClass}`;

    button.appendChild(icon);
    return button;
}

export function loadDisplayMode() {
    const mode = localStorage.getItem('displayMode') || 'grid';
    localStorage.setItem('displayMode', mode);

    if (mode === 'list') {
        dom.btnViewToggle.querySelector('i').className = 'fa-solid fa-table fa-lg';
        dom.btnViewToggle.title = 'Grid view';
    }
}

export function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    localStorage.setItem('theme', theme);

    updateTheme(theme);
}

function updateTheme(theme) {
    const isDarkTheme = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDarkTheme);
}

// ОКНО СОЗДАНИЯ ЗАМЕТКИ
export function unfoldNoteInput() {
    console.log('unfoldNoteInput');
    state.isNoteInputUnfolded = true;
    dom.inputTitleCreate.style.display = 'block';
    dom.btnSubmitCreate.style.display = 'block';
    dom.btnBackgroundCreate.style.display = 'block';
    dom.btnBackgroundCreate.style.fontSize = '15px';
    dom.inputNoteCreate.style.fontSize = '13px';
    dom.inputGroupCreate.style.flexDirection = 'column';
    dom.inputGroupCreate.style.alignItems = 'flex-start';
    dom.btnListCreate.style.fontSize = '15px';
    dom.btnImageCreate.style.fontSize = '15px';
    dom.actionsNoteCreate.style.width = '100%';
    dom.formNoteCreate.classList.add('none');
    dom.formNoteCreate.setAttribute('data-color', 'none');
    dom.formNoteCreate.style.boxShadow = '0 3px 5px rgba(0, 0, 0, 0.3), 0 -0.5px 1px rgba(0, 0, 0, 0.05), 2px 2px 2px rgba(0, 0, 0, 0.1), -2px 2px 2px rgba(0, 0, 0, 0.1)';
}

export function foldNoteInput() {
    console.log('foldNoteInput');
    state.isListItemsAddMode = false;
    state.isNoteInputUnfolded = false;
    dom.inputTitleCreate.value = '';
    dom.inputTitleCreate.style.display = 'none';
    dom.inputNoteCreate.value = '';
    dom.inputNoteCreate.removeAttribute('style');
    dom.btnSubmitCreate.style.display = 'none';
    dom.btnBackgroundCreate.style.display = 'none';
    dom.inputGroupCreate.removeAttribute('style');
    dom.btnListCreate.style.fontSize = '20px';
    dom.btnImageCreate.style.fontSize = '20px';
    dom.actionsNoteCreate.removeAttribute('style');
    dom.formNoteCreate.classList.remove(dom.formNoteCreate.getAttribute('data-color'));
    dom.formNoteCreate.removeAttribute('data-color');
    dom.formNoteCreate.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1), 0 -0.5px 1px rgba(0, 0, 0, 0.05)';
}

// ЗАГРУЗКА КОНТЕЙНЕРА ЗАМЕТОК
export function updateContentUI(activeButton, noContentIconClass, noContentTextContent) {
    console.log('updateContentUI: activeButton', activeButton);

    let buttons = [dom.btnMenuArchive, dom.btnMenuTrash, dom.btnMenuNotes];
    updateButtonState(activeButton, buttons);
    updateNoContentMessage(noContentIconClass, noContentTextContent);
    hideUIElements();
}

export async function updateContentUIFromHash() {
    const hashActions = {
        '#archive': async () => {
            updateContentUI(dom.btnMenuArchive, 'fa-solid fa-box', 'Your archived notes appear here');
            
            let token = await getTokenOrCoverContainer();
            if (!token) return;

            try {
                const data = await getArchivedNotesFromServer(token);
                fillNotesContainer(data); 
            } catch (error) {
                console.log('Error: ', error);
                coverNotesContainer();
            }
        },
        '#trash': async () => {
            updateContentUI(dom.btnMenuTrash, 'fa-regular fa-trash-can', 'No notes in Trash');
            dom.messageTrash.style.display = 'flex';

            let token = await getTokenOrCoverContainer();
            if (!token) return;

            try {
                const data = await getDeletedNotesFromServer(token);
                fillNotesContainer(data);
            } catch (error) {
                console.log('Error: ', error);
                coverNotesContainer();
            }
        },
        '#home': async () => {
            updateContentUI(dom.btnMenuNotes, 'fa-regular fa-lightbulb', 'Notes you add appear here');
            dom.noteCreate.style.display = 'block';
            dom.notesContainer.appendChild(dom.pinnedText);
            dom.notesContainer.appendChild(dom.othersText);

            let token = await getTokenOrCoverContainer();
            if (!token) return;

            try {
                const data = await getDefaultNotesFromServer(token);
                fillNotesContainer(data);
            } catch (error) {
                console.log('Error: ', error);
                coverNotesContainer();
            }
        },
        '#search': () => {
            hideUIElements();
            updateNoContentMessage('', 'No matching results.');
            dom.notesContainer.appendChild(dom.pinnedText);
            dom.notesContainer.appendChild(dom.othersText);
        }
    };

    const hash = window.location.hash;
    if (hashActions[hash]) {
        hashActions[hash]();
    } else {
        window.location.hash = 'home';
        return;
    }

    fillSelectToolbar();
}

function updateButtonState(activeButton, buttons) {
    buttons.forEach(button => {
        button.classList.toggle('active', button === activeButton);
        button.classList.toggle('inactive', button !== activeButton);
    });
}

function updateNoContentMessage(iconClass, message) {
    dom.iconNoContent.querySelector('i').className = iconClass;
    dom.textNoContent.textContent = message;
}

function hideUIElements() {
    dom.messageNoContent.style.display = 'none';
    dom.noteCreate.style.display = 'none';
    dom.messageTrash.style.display = 'none';
    dom.btnEmptyTrash.style.display = 'none';
    dom.notesContainer.innerHTML = '';
    dom.notesContainer.style.removeProperty('height');
}