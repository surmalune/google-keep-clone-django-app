import { createElement } from '../ui.js';

import { handleColorOptionClick } from '../handlers.js';

import { updateNoteOnServer } from '../backend.js';

import { getTokenOrRedirect } from './auth.js';

import { positionElement } from './position.js';

const colors = ['none', 'coral', 'peach', 'sand', 'sage', 'fog', 'storm', 'dusk'];

export function createColorToolbar(event, chosenColor = 'no-select', isMultiSelect = false) {
    console.log('createColorToolbar', chosenColor);

    const colorToolbar = document.querySelector('.change-background');
    if (colorToolbar) colorToolbar.remove();

    const newColorToolbar = createElement('div', 'change-background', '', { 'tabindex': '0' });

    const notes = isMultiSelect ? null : event.target.closest('.box-note, #note-form');
    const colorOptions = createOptionsContainer(chosenColor, notes);

    newColorToolbar.appendChild(colorOptions);
    document.body.appendChild(newColorToolbar);
    positionElement(newColorToolbar, event.target);

    event.stopPropagation();
}

function createOptionsContainer(chosenColor, notes) {
    const colorOptionsContainer = createElement('div', 'change-background-color', '', { tabindex: '0', role: 'listbox' });


    colors.forEach(color => {
        const option = createColorOption(color, chosenColor);
        option.addEventListener('click', (event) => handleColorOptionClick(event, notes));
        colorOptionsContainer.appendChild(option);
    });

    return colorOptionsContainer;
}

function createColorOption(color, choosenColor) {
    const colorOption = createElement('div', `color-option ${color}`, '', { 'role': 'option' });

    const selectColorIcon = createElement('i', 'fa-solid fa-circle-check select-color-icon');
    const noColorIcon = createElement('i', 'fa-solid fa-droplet-slash no-color-icon');
    if (color === 'none') {
        colorOption.appendChild(noColorIcon);
    }
    selectColorIcon.style.display = 'none';
    colorOption.appendChild(selectColorIcon);

    if (choosenColor === color) {
        colorOption.classList.add('chosen');
        colorOption.querySelector('.select-color-icon').style.display = 'inline-block';
    }

    return colorOption;
}

export async function applyColorToNotes(notes, chosenColor) {
    notes.forEach(async note => {
        colors.forEach(c => note.classList.remove(c));
        note.classList.add(chosenColor);
        note.setAttribute('data-color', chosenColor);

        const noteId = note.getAttribute('data-id');
        if (noteId) {
            const payload = {
                "color": chosenColor
            };

            let token = await getTokenOrRedirect();
            if (!token) return;

            try {
                updateNoteOnServer(noteId, payload, token);
            } catch(error) {
                console.log('Error: ', error);
            }
        }
    });
}