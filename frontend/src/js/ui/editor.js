import { createElement, dom, state } from '../ui.js';

import { handleOneNoteColorClick, handleTextEditInput, handleTitleEditInput, handleTitleEditKeydown,
    handleCheckboxIconClick, handleEditorCheckboxClick, handleCheckboxDeleteClick, handleCheckboxBackspace, handleEmptyCheckboxInput,
    handleEmptyCheckboxKeydown, handleCheckboxFocus, handleCheckboxBlur, handleCheckboxKeydown,
    handleNoteEditClick } from '../handlers.js';

import { moveToTrashNote, archiveNote, deleteNoteOnServer, restoreNote, updateNoteOnServer, deleteImage} from '../backend.js';

import { getTokenOrRedirect } from './auth.js';

import { deleteNoteFromContainer } from './note.js';

import { clearContainer, initImageFileInput } from './image.js';

export function setupNoteEditElements(note, editorNote) {
    console.log('setupNoteEditElements');

    const emptyNote = editorNote.querySelector('.empty-note');
    if (emptyNote) {
        emptyNote.style.display = 'none';
    }

    const imageIcon = editorNote.querySelector('.fa-image');
    if (imageIcon) {
        imageIcon.addEventListener('click', () => {
            // TODO: дописать отправление информации на сервер
            initImageFileInput(editorNote.querySelector('.images-container'));
        });
    }

    const paletteIcon = editorNote.querySelector('.fa-palette');
    if (paletteIcon) {
        // TODO: вынести оттуда отправление информации на сервер
        paletteIcon.addEventListener('click', handleOneNoteColorClick);
    }

    const moveToTrashButton = editorNote.querySelector('.delete-button');
    if (moveToTrashButton) {
        moveToTrashButton.addEventListener('click', async () => {
            let token = await getTokenOrRedirect();
            if (!token) return;

            const noteId = note.getAttribute('data-id');

            try {
                moveToTrashNote(noteId, token);
            } catch(error) {
                console.log('Error: ', error);
            }

            deleteNoteFromContainer(note);
            closeEditor();
        });
    }

    const pinIcon = editorNote.querySelector('.pin-icon');
    if (pinIcon) {
        pinIcon.addEventListener('click', async () => {
            togglePinIcon(pinIcon);
            const originalPinIcon = note.querySelector('.pin-icon');

            await pinNote(note, originalPinIcon);
        });
    }

    const archiveIcon = editorNote.querySelector('.fa-box') || editorNote.querySelector('.fa-box-open');
    if (archiveIcon) {
        archiveIcon.addEventListener('click', async () => {

            let token = await getTokenOrRedirect();
            if (!token) return;

            const noteId = note.getAttribute('data-id');
            const isArchived = archiveIcon.title === 'Archive' ? true : false;

            try {
                await archiveNote(noteId, isArchived, token);
            } catch(error) {
                console.log('Error: ', error);
            }

            deleteNoteFromContainer(note);
            closeEditor();
        });
    }

    const deleteForeverIcon = editorNote.querySelector('.fa-trash:not(.img-delete)');
    if (deleteForeverIcon) {
        deleteForeverIcon.addEventListener('click', async () => {
            let token = await getTokenOrRedirect();
            if (!token) return;

            const noteId = note.getAttribute('data-id');

            try {
                await deleteNoteOnServer(noteId, token);
            } catch(error) {
                console.log('Error: ', error);
            }

            deleteNoteFromContainer(note);
            closeEditor();
        });
    }

    const restoreIcon = editorNote.querySelector('.fa-trash-arrow-up');
    if (restoreIcon) {
        restoreIcon.addEventListener('click', async () => {

            let token = await getTokenOrRedirect();
            if (!token) return;
        
            const noteId = note.getAttribute('data-id');

            try {
                restoreNote(noteId, token);
            } catch(error) {
                console.log('Error: ', error);
            }

            deleteNoteFromContainer(note);
            closeEditor();
        });
    }

    setupEditTitle(editorNote);
    setupEditCheckboxes(editorNote);
    setupEditImages(note, editorNote);
    setupEditText(editorNote);
}

export async function pinNote(note, pinIcon) {
    let token = await getTokenOrRedirect();
    if (!token) return;

    togglePinIcon(pinIcon);

    const noteId = note.getAttribute('data-id');
    const payload = {
        status: pinIcon.title === 'Unpin note' ? 'pinned' : 'normal'
    };

    try {
        updateNoteOnServer(noteId, payload, token);
    } catch(error) {
        console.log('Error: ', error);
    }

    dom.notesContainer.insertBefore(note, dom.notesContainer.firstChild);
}

function setupEditText(editorNote) {
    console.log('setupTextEditing');

    const editorNoteText = editorNote.querySelector('.note-text');
    const checkboxesContainer = editorNote.querySelector('.checkboxes-container');
    toggleNoteDisplay(editorNoteText, checkboxesContainer);

    const textPlaceholder = createElement('div', 'text-placeholder', 'Note');
    const textEditable = createEditableElement('note-text-input', handleTextEditInput);
    setupTextContent(editorNoteText, textPlaceholder, textEditable);

    editorNoteText.appendChild(textPlaceholder);
    editorNoteText.appendChild(textEditable);
}

function setupEditTitle(editorNote) {
    console.log('setupTitleEditing');

    const editorNoteTitle = editorNote.querySelector('.note-title-text');
    toggleTitleDisplay(editorNoteTitle);
    
    const titlePlaceholder = createElement('div', 'title-placeholder', 'Title');
    const titleEditable = createEditableElement('title-text-input', handleTitleEditInput);
    titleEditable.addEventListener('keydown', handleTitleEditKeydown);
    setupTextContent(editorNoteTitle, titlePlaceholder, titleEditable);

    editorNoteTitle.appendChild(titlePlaceholder);
    editorNoteTitle.appendChild(titleEditable);
}

function toggleNoteDisplay(text, container) {
    if ((container.innerHTML !== '' && container.childElementCount > 1) || 
     (text.textContent.trim() === '' && window.location.hash === '#trash')) 
    {
        text.style.display = 'none';
    } else {
        text.style.display = 'block';
    }
}

function toggleTitleDisplay(title) {
    if (title.textContent.trim() === '' && window.location.hash === '#trash') {
        title.style.display = 'none';
    } else {
        title.style.display = 'block';
    }
}

function createEditableElement(className, inputHandler) {
    const editableElement = createElement('div', className);
    editableElement.style.display = 'block';
    editableElement.contentEditable = window.location.hash === '#trash' ? 'false' : 'true';
    editableElement.role = 'textbox';
    editableElement.tabIndex = '0';
    editableElement.spellcheck = 'true';
    editableElement.addEventListener('input', inputHandler);
    return editableElement;
}

function setupTextContent(text, placeholder, editableElement) {
    if (text.textContent.trim() === '') {
        placeholder.style.display = 'block';
    } else {
        placeholder.style.display = 'none';
        editableElement.innerHTML = text.innerHTML;
        text.textContent = '';
    }
}

function setupEditImages(note, editorNote) {
    console.log('setupEditImages');

    const container = editorNote.querySelector('.images-container');
    if (container.innerHTML !== '') {
        const imgDeleteButton = container.querySelector('.img-delete-button');

        imgDeleteButton.style.removeProperty('display');
        imgDeleteButton.addEventListener('click', async () => {
            clearContainer(container);

            let token = await getTokenOrRedirect();
            if (!token) return;

            const noteId = note.getAttribute('data-id');

            try {
                deleteImage(noteId, token);
            } catch(error) {
                console.log('Error: ', error);
            }
        });
    }
}

function setupEditCheckboxes(editorNote) {
    console.log('setupEditCheckboxes');

    const checkboxesContainer = editorNote.querySelector('.checkboxes-container');
    if (checkboxesContainer.innerHTML !== '' && checkboxesContainer.childElementCount > 1) {
        if (window.location.hash !== '#trash') {

            // TODO: дублирование (см выше)
            const currentHeight = parseFloat(checkboxesContainer.style.height) || 32;
            checkboxesContainer.style.height = `${currentHeight + 32}px`;
            checkboxesContainer.style.removeProperty('padding-top');

            const emptyCheckbox = checkboxesContainer.querySelector('.empty-checkbox');
            emptyCheckbox.style.removeProperty('display');
            
            checkboxesContainer.querySelectorAll('.checkbox-icon .check-icon').forEach(icon => {
                icon.addEventListener('click', handleEditorCheckboxClick);
            });
            
            checkboxesContainer.querySelectorAll('.checkbox-delete-button').forEach(button => {
                button.style.removeProperty('display');
                button.addEventListener('click', handleCheckboxDeleteClick);
            });

            checkboxesContainer.querySelectorAll('.checkbox-text').forEach(text => {
                text.addEventListener('keydown', handleCheckboxBackspace);
                text.contentEditable = 'true';
                text.style.removeProperty('cursor');
            });

            emptyCheckbox.addEventListener('input', handleEmptyCheckboxInput);
            emptyCheckbox.addEventListener('keydown', handleEmptyCheckboxKeydown);
        }
        
        checkboxesContainer.querySelectorAll('.checkbox:not(.empty-checkbox)').forEach(checkbox => {
            const checkboxText = checkbox.querySelector('.checkbox-text');
            checkboxText.addEventListener('focus', handleCheckboxFocus);
            checkboxText.addEventListener('blur', handleCheckboxBlur);
            checkboxText.addEventListener('keydown', handleCheckboxKeydown);
        });
    }
}

export function updateNoteEditIcons(editorNote) {
    const pinIcon = editorNote.querySelector('.pin-icon');
    if (pinIcon) {
        pinIcon.classList.add('edit');
    }
    editorNote.querySelector('.note-title-text').classList.add('edit');
    editorNote.querySelector('.note-text').classList.add('edit');
    editorNote.querySelector('.note-toolbar').classList.add('edit');
    editorNote.querySelector('.select-note-icon').style.display = 'none';
}

export function updateNoteColor(note, editorNote) {
    note.classList.remove(note.getAttribute('data-color'));
    note.classList.add(editorNote.getAttribute('data-color'));
    note.setAttribute('data-color', editorNote.getAttribute('data-color'));
}

export function updateNoteTitle(title, note) {
    const noteTitle = note.querySelector('.note-title-text');
    if (title.textContent !== '') {
        noteTitle.style.display = 'block';
        noteTitle.textContent = title.textContent;
    } else {
        noteTitle.style.display = 'none';
        noteTitle.textContent = '';
    }
}

export function updateNoteText(textInput, textNote) {
    textNote.innerText = textInput.innerText;
    textNote.style.display = textInput.textContent === '' ? 'none' : 'block';
}

export function updateCheckboxes(curContainer, originalContainer) {
    if (window.location.hash === '#trash') {
        return;
    }

    if (curContainer.innerHTML !== '' && curContainer.childElementCount > 1) {

        // TODO: дублирование?
        originalContainer.innerHTML = '';
        Array.from(curContainer.cloneNode(true).children).forEach(child => {
            originalContainer.appendChild(child);
        });

        const currentHeight = parseFloat(curContainer.style.height) || 32;
        originalContainer.style.height = `${currentHeight - 32}px`;
        originalContainer.style.paddingTop = '10px';

        const emptyCheckbox = originalContainer.querySelector('.empty-checkbox');
        emptyCheckbox.style.display = 'none';

        originalContainer.querySelectorAll('.checkbox-icon .check-icon').forEach(icon => {
            icon.addEventListener('click', handleCheckboxIconClick);
        });

        originalContainer.querySelectorAll('.checkbox-delete-button').forEach(button => {
            button.style.display = 'none';
        });

        originalContainer.querySelectorAll('.checkbox-text').forEach(text => {
            text.contentEditable = 'false';
            text.style.cursor = 'default';
        });
    } else {
        clearContainer(originalContainer);
        originalContainer.style.height = '32px';
    }
}
 
export function updateImages(curContainer, originalContainer) {
    if (curContainer.innerHTML !== '') {

        // TODO: дублирование?
        originalContainer.innerHTML = '';
        Array.from(curContainer.cloneNode(true).children).forEach(child => {
            originalContainer.appendChild(child);
        });

        const currentPaddingTop = parseFloat(curContainer.style.paddingTop);
        originalContainer.style.paddingTop = `${currentPaddingTop}%`;
        originalContainer.style.display = curContainer.style.display;

        originalContainer.querySelector('.img-delete-button').style.display = 'none';
    } else {
        clearContainer(originalContainer);
    }
}

// TODO: дублировани
export function handleEmptyNote(content, title, curCheckboxesContainer, curImagesContainer, originalCheckboxesContainer, note) {
    if (
        content.textContent === '' &&
        title.textContent === '' &&
        (curCheckboxesContainer.innerHTML === '' ||
            curCheckboxesContainer.childElementCount === 1) &&
        curImagesContainer.innerHTML === ''
    ) {
        if (!note.querySelector('.empty-note')) {
            const emptyNote = createElement('div', 'empty-note', 'Empty note');
            note.querySelector('.note').appendChild(emptyNote);
            emptyNote.addEventListener('click', handleNoteEditClick);
            originalCheckboxesContainer.style.display = 'none';
        }
    } else if (note.querySelector('.empty-note')) {
        note.querySelector('.note').removeChild(note.querySelector('.empty-note'));
    }
}

export function resetNoteState() {
    dom.noteEditContainer.style.display = 'none';
    dom.noteEditContainer.innerHTML = '';
    document.body.style.removeProperty('overflow-y');

    state.currentNote.style.removeProperty('overflow-y');
    state.currentNote.style.removeProperty('max-height');
    state.currentNote = null;
}

function closeEditor() {
    document.body.style.removeProperty('overflow-y');        
    dom.noteEditContainer.style.display = 'none';
    dom.noteEditContainer.innerHTML = '';
    dom.overlay.style.display = 'none';
    state.currentNote = null;
}

function togglePinIcon(pinIcon) {
    if (pinIcon.title === 'Pin note') {
        pinIcon.title = 'Unpin note';
        pinIcon.style.color = 'var(--dim-button-hover-color)';
    }
    else {
        pinIcon.title = 'Pin note';
        pinIcon.style.removeProperty('color');
    }
}