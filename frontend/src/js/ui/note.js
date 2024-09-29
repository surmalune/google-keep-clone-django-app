import { createIcon, createElement, dom, state } from '../ui.js';

import { handleSelectClick, handleNoteEditClick, handlePinIconClick, handleOneNoteColorClick, handleArchiveClick,
    handleDeleteForeverClick, handleRestoreClick, handleMoveToTrashClick
 } from '../handlers.js';

import { Note, ListItem, fetchImage } from '../backend.js';

import { createCheckbox, positionAllCheckboxes } from './checkbox.js';

import { createImagesContainer, initImageFileInput } from './image.js';

import { updateVisibility, updateNotePositions, getFactWidthForList } from './position.js';

import { getTokenOrRedirect } from './auth.js';

export function addNoteToList(note) { 
    console.log('addNoteToList');
    dom.messageNoContent.style.display = 'none';

    const boxNote = createNoteContainer(note.color, note.id);
    const selectIcon = createIcon('fa-solid fa-circle-check select-note-icon', 'Select note', handleSelectClick);
    const noteDiv = createElement('div', 'note');
    const noteContent = createNoteContent(note);
    const toolbar = createToolbar(boxNote);

    noteDiv.appendChild(noteContent);
    noteDiv.appendChild(toolbar);
    boxNote.appendChild(selectIcon);
    boxNote.appendChild(noteDiv);
    dom.notesContainer.insertBefore(boxNote, dom.notesContainer.firstChild);

    // TODO: дублирование
    handleEmptyNoteState(boxNote, note);
}

function handleEmptyNoteState(boxNote, note) {
    const checkboxesContainer = boxNote.querySelector('.checkboxes-container');
    const isEmptyNote = isNoteEmpty(note, checkboxesContainer);
    let emptyNote = boxNote.querySelector('.empty-note');

    if (isEmptyNote && !emptyNote) {
        emptyNote = createElement('div', 'empty-note', 'Empty note');
        emptyNote.addEventListener('click', handleNoteEditClick);

        boxNote.querySelector('.note').appendChild(emptyNote);
    } else if (!isEmptyNote && emptyNote) {
        boxNote.querySelector('.note').removeChild(emptyNote);
    }
}

function isNoteEmpty(note, checkboxesContainer) {
    return (!note.title || note.title === '') && (!note.content || note.content === '') &&
           checkboxesContainer.childElementCount < 2 && !note.image;
}
 
function createNoteContainer(dataColor, dataId) {
    const boxDiv = createElement('div', 'box-note');
    boxDiv.setAttribute('data-selected', 'false');
    boxDiv.setAttribute('data-id', dataId);
    boxDiv.setAttribute('data-color', dataColor || 'none');
    boxDiv.classList.add(dataColor || 'none');

    const width = localStorage.getItem('displayMode') === 'list' || state.isOneNoteInRow ? getFactWidthForList() - 32 : 240;
    boxDiv.style.width = `${width}px`;

    return boxDiv;
}

function createNoteContent(note) {
    const textAndTitleDiv = createElement('div', 'text-and-title-note')
    textAndTitleDiv.addEventListener('click', handleNoteEditClick);

    if (window.location.hash === '#home') {
        const pinIcon = createIcon(
            'fa-solid fa-thumbtack pin-icon', 
            note.status === 'pinned' ? 'Unpin note' : 'Pin note',
            handlePinIconClick
        );

        if (note.status === 'pinned') {
            pinIcon.style.color = 'var(--dim-button-hover-color)';
        }

        textAndTitleDiv.appendChild(pinIcon);
    }

    const imagesContainer = createElement('div', 'images-container');
    setupImages(imagesContainer, note.image);
    textAndTitleDiv.appendChild(imagesContainer);

    const titleDiv = createElement('div', 'note-title-text', note.title);
    titleDiv.style.display = note.title && note.title !== '' ? 'block' : 'none';
    textAndTitleDiv.appendChild(titleDiv);

    const noteTextDiv = createElement('div', 'note-text', note.content);
    noteTextDiv.style.display = note.content && note.content !== '' ? 'block' : 'none';
    textAndTitleDiv.appendChild(noteTextDiv);

    const checkboxesContainer = createElement('div', 'checkboxes-container');
    setupCheckboxes(checkboxesContainer, note);
    textAndTitleDiv.appendChild(checkboxesContainer);

    return textAndTitleDiv;
}

function createToolbar(boxDiv) {
    const toolbarDiv = createElement('div', 'note-toolbar')

    const leftIcons = document.createElement('div');
    leftIcons.style.display = 'flex';

    const hash = window.location.hash;
    if (['#home', '#archive', '#search'].includes(hash)) {
        addDefaultNoteIcons(leftIcons, boxDiv, hash);
        toolbarDiv.appendChild(leftIcons);

        const deleteButton = createDeleteButton();
        toolbarDiv.appendChild(deleteButton);
    }
    else if (hash === '#trash') {
        addTrashNoteIcons(leftIcons);
        toolbarDiv.appendChild(leftIcons);
    }

    return toolbarDiv;
}

function addDefaultNoteIcons(leftIcons, boxDiv, currentHash) {
    leftIcons.appendChild(createIcon('fas fa-image', 'Add image', () => {
        initImageFileInput(boxDiv.querySelector('.images-container'));
    }));
    leftIcons.appendChild(createIcon('fa-solid fa-palette', 'Change background color', handleOneNoteColorClick));

    if (currentHash === '#archive') {
        leftIcons.appendChild(createIcon('fa-solid fa-box-open', 'Unarchive', handleArchiveClick));
    } 
    else {
        leftIcons.appendChild(createIcon('fa-solid fa-box', 'Archive', handleArchiveClick));
    }
}

function addTrashNoteIcons(leftIcons) {
    leftIcons.appendChild(createIcon('fa-solid fa-trash', 'Delete forever', handleDeleteForeverClick));
    leftIcons.appendChild(createIcon('fa-solid fa-trash-arrow-up', 'Restore', handleRestoreClick));
}

function createDeleteButton() {
    const deleteButton = createElement('button', 'delete-button');
    deleteButton.addEventListener('click', handleMoveToTrashClick);

    const trashIcon = createIcon('fa-solid fa-xmark', 'Delete');
    deleteButton.appendChild(trashIcon);

    return deleteButton;
}

async function setupImages(imagesContainer, imageUrl) {
    if (!imageUrl) {
        return;
    }

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        const imageBlobUrl = await fetchImage(imageUrl, token);
        loadImage(imagesContainer, imageBlobUrl);
    } catch (error) {
        console.error('Error loading image:', error);
    }
}

async function loadImage(imagesContainer, imageUrl) {
    if (!imageUrl) return null;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            createImagesContainer(img, imagesContainer);
            imagesContainer.querySelector('.img-delete-button').style.display = 'none';
            updateNotePositions();
            resolve(img);
        };
        img.onerror = function() {
            reject(new Error(`Failed to load image: ${imageUrl}`));
        };
        img.src = imageUrl;
    });
}

function setupCheckboxes(checkboxesContainer, note) {
    if (note.type !== 'list') {
        return;
    }

    const checkboxesContainerHeight = `${note.list_items.length * 32}px`;
    setContainerStyle(checkboxesContainer, checkboxesContainerHeight, '10px', 'block');

    note.list_items.forEach(item => {
        const checkbox = createCheckbox(false, item.is_checked, item.text, item.id);
        checkboxesContainer.appendChild(checkbox);
    });

    checkboxesContainer.appendChild(createCheckbox(true));
    positionAllCheckboxes(checkboxesContainer.querySelector('.checkbox'));

    checkboxesContainer.querySelector('.empty-checkbox').style.display = 'none';
    hideElements(checkboxesContainer.querySelectorAll('.checkbox-delete-button'));
    disableEditing(checkboxesContainer.querySelectorAll('.checkbox-text'));
}

function setContainerStyle(container, height, paddingTop, display) {
    container.style.height = height;
    container.style.paddingTop = paddingTop;
    container.style.display = display;
}

function hideElements(elements) {
    elements.forEach(element => element.style.display = 'none');
}

function disableEditing(elements) {
    elements.forEach(text => {
        text.contentEditable = 'false';
        text.style.cursor = 'default';
    });
}

function updateNotesContainerState() {
    if (dom.notesContainer.querySelectorAll('.box-note').length === 0) {
        coverNotesContainer();
    }
}

export function coverNotesContainer() {
    dom.messageNoContent.style.display = 'flex';
    if (window.location.hash === '#trash') {
        dom.btnEmptyTrash.style.display = 'none';
    }
}

export function deleteNoteFromContainer(note) {
    dom.notesContainer.removeChild(note);
    updateVisibility();
    updateNotePositions();
    updateNotesContainerState();
}

export function fillNotesContainer(data) {
    console.log('fillNotesContainer', data);
    
    data.map(noteData => {
        let note;
        if (noteData.type === 'list') {
            const listItems = noteData.list_items.map(item => new ListItem(item.id, item.text, item.order, item.is_checked));
            note = new Note(noteData.id, noteData.title, null, noteData.type, noteData.color, 
                noteData.status, listItems, noteData.image);
        } else {
            note = new Note(noteData.id, noteData.title, noteData.content, noteData.type, noteData.color, 
                noteData.status, noteData.list_items, noteData.image);
        }
        addNoteToList(note);
    });

    updateVisibility();
    updateNotePositions();

    if (data.length === 0) {
        dom.messageNoContent.style.display = 'flex';
    }
    else if (window.location.hash === '#trash') {
        dom.btnEmptyTrash.style.display = 'block';
    }
}