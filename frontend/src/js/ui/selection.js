import { dom, state, createButton } from '../ui.js';

import { handlePinSelection, handleBackgroundSelection, handleArchiveSelection, handleDeleteSelection,
    handleUnarchiveSelection, handleDeleteForeverSelection, handleRestoreSelection
 } from '../handlers.js';

import { updateNoteOnServer } from '../backend.js';

import { getTokenOrRedirect } from './auth.js';

import { deleteNoteFromContainer } from './note.js';

export function updateSelectedCount(count) {
    dom.textSelection.textContent = `${count} selected`;
}

export function hideSelectMode() {
    dom.headerSelection.removeAttribute('style');

    const boxNotes = document.querySelectorAll('.box-note');
    boxNotes.forEach(note => {
        note.classList.remove('selected');
        note.setAttribute('data-selected', 'false');
    });

    const selectIcons = document.querySelectorAll('.select-note-icon');
    selectIcons.forEach(icon => {
        icon.classList.remove('visible');
    });

    state.selectedCount = 0;
    state.selectedNotes.splice(0, state.selectedNotes.length);
}

export function fillSelectToolbar() {
    const toolbar = dom.headerSelection.querySelector('.select-toolbar');
    toolbar.innerHTML = '';

    const currentHash = window.location.hash;
    const buttonConfigs = getButtonConfigs(currentHash);

    buttonConfigs.forEach(config => {
        const button = createButton(config.id, config.iconClass, config.label);
        toolbar.appendChild(button);
        button.addEventListener('click', config.handler);
    });
}

function getButtonConfigs(hash) {
    const commonButtons = [
        { id: 'btn-pin-selection', iconClass: 'fa-thumbtack', label: 'Pin', handler: handlePinSelection },
        { id: 'btn-background-selection', iconClass: 'fa-palette', label: 'Background options', handler: handleBackgroundSelection }
    ];

    const hashSpecificButtons = {
        '#home': [
            ...commonButtons,
            { id: 'btn-archive-selection', iconClass: 'fa-box', label: 'Archive', handler: handleArchiveSelection },
            { id: 'btn-delete-selection', iconClass: 'fa-trash', label: 'Delete', handler: handleDeleteSelection }
        ],
        '#search': [
            ...commonButtons,
            { id: 'btn-archive-selection', iconClass: 'fa-box', label: 'Archive', handler: handleArchiveSelection },
            { id: 'btn-delete-selection', iconClass: 'fa-trash', label: 'Delete', handler: handleDeleteSelection }
        ],
        '#archive': [
            ...commonButtons,
            { id: 'btn-unarchive-selection', iconClass: 'fa-box-open', label: 'Unarchive', handler: handleUnarchiveSelection },
            { id: 'btn-delete-selection', iconClass: 'fa-trash', label: 'Delete', handler: handleDeleteSelection }
        ],
        '#trash': [
            { id: 'btn-delete-forever-selection', iconClass: 'fa-trash', label: 'Delete forever', handler: handleDeleteForeverSelection },
            { id: 'btn-restore-selection', iconClass: 'fa-trash-arrow-up', label: 'Restore', handler: handleRestoreSelection }
        ]
    };

    return hashSpecificButtons[hash] || [];
}

export async function modifySelectedNotes(payload) {
    state.selectedNotes.forEach(async note => {
        const noteElement = note.closest('.box-note');
        const noteId = noteElement.getAttribute('data-id');

        let token = await getTokenOrRedirect();
        if (!token) return;

        try {
            updateNoteOnServer(noteId, payload, token);
        } catch(error) {
            console.log('Error: ', error);
        }

        deleteNoteFromContainer(noteElement);
    });
}