import { createElement, dom } from '../ui.js';

import { handleCheckboxIconClick, handleEmptyCheckboxInput, handleEmptyCheckboxKeydown,
    handleCheckboxKeydown, handleCheckboxBackspace, handleCheckboxDeleteClick } from '../handlers.js';

export function createCheckbox(isEmpty, isChecked = false, text = '', id = null) {
    const oneCheckbox = createElement('div', 'checkbox');

    if (id) {
        oneCheckbox.setAttribute('data-listitem-id', id);
    }

    if (isEmpty) {
        oneCheckbox.classList.add('empty-checkbox');
    }

    const checkboxIconContainer = createCheckboxIconContainer(isEmpty, isChecked);
    const checkboxInput = createCheckboxInput(isEmpty, isChecked, text);

    oneCheckbox.appendChild(checkboxIconContainer);
    oneCheckbox.appendChild(checkboxInput);

    return oneCheckbox;
}
 
function createCheckboxIconContainer(isEmpty, isChecked = false) {
    const checkboxIconContainer = createElement('div', 'checkbox-icon');
    const checkboxIcon = createCheckboxIcon(isEmpty, isChecked);

    if (!isEmpty && window.location.hash !== '#trash') {
        checkboxIconContainer.addEventListener('click', handleCheckboxIconClick);
    }
    else if (!isEmpty) {
        checkboxIcon.style.color = 'var(--header-button-icon)';
        checkboxIcon.style.cursor = 'not-allowed';
    }

    checkboxIconContainer.appendChild(checkboxIcon);
    return checkboxIconContainer;
}

function createCheckboxIcon(isEmpty, isChecked) {
    const checkboxIcon = document.createElement('i');
    
    if (isEmpty) {
        checkboxIcon.className = 'fa-solid fa-plus new-checkbox-icon';
    } else {
        checkboxIcon.className = isChecked 
            ? 'fa-regular fa-square-check check-icon' 
            : 'fa-regular fa-square check-icon';
    }

    return checkboxIcon;
}

function createCheckboxInput(isEmpty, isChecked = false, text = '') {
    const checkboxInput = createElement('div', 'checkbox-input');

    const checkboxPlaceholder = createCheckboxPlaceholder(isEmpty);
    const checkboxText = createCheckboxText(isEmpty, isChecked, text);

    checkboxInput.appendChild(checkboxPlaceholder);
    checkboxInput.appendChild(checkboxText);

    if (!isEmpty) {
        const checkboxDeleteButton = createCheckboxDeleteButton();
        checkboxInput.appendChild(checkboxDeleteButton);
    }

    return checkboxInput;
}

function createCheckboxPlaceholder(isEmpty) {
    const checkboxPlaceholder = createElement('div', 'checkbox-text-empty', 'List item');
    if (isEmpty) {
        checkboxPlaceholder.style.display = 'block';
    }

    return checkboxPlaceholder;
}

function createCheckboxText(isDefault, isChecked, text) {
    const checkboxText = createElement('div', 'checkbox-text');
    checkboxText.contentEditable = 'true';
    checkboxText.tabIndex = '0';
    checkboxText.spellcheck = 'true';
    checkboxText.textContent = text;

    if (isDefault) {
        checkboxText.addEventListener('input', handleEmptyCheckboxInput);
        checkboxText.addEventListener('keydown', handleEmptyCheckboxKeydown);
    } else {
        // TODO: в мейк нужны, в заметке не нужны, в редакторе нужны
        // checkboxText.addEventListener('focus', handleCheckboxFocus);
        // checkboxText.addEventListener('blur', handleCheckboxBlur);
        checkboxText.addEventListener('keydown', handleCheckboxKeydown);
        checkboxText.addEventListener('keydown', handleCheckboxBackspace);
    }

    if (isChecked) {
        checkboxText.style.textDecoration = 'line-through';
        checkboxText.style.opacity = '0.7';
    }

    return checkboxText;
}

function createCheckboxDeleteButton() {
    const checkboxDeleteButton = createElement('div', 'checkbox-delete-button');
    checkboxDeleteButton.role = 'button';
    checkboxDeleteButton.tabIndex = '0';
    checkboxDeleteButton.title = 'Delete';

    const checkboxDeleteIcon = createElement('i', 'fa-solid fa-xmark');
    checkboxDeleteButton.appendChild(checkboxDeleteIcon);

    checkboxDeleteButton.addEventListener('click', handleCheckboxDeleteClick);

    return checkboxDeleteButton;
}

export function insertNewCheckbox(originalCheckbox, newCheckbox) {
    const parent = originalCheckbox.parentNode;
    const currentHeight = parseFloat(parent.style.height) || 32;

    parent.insertBefore(newCheckbox, originalCheckbox);
    parent.style.height = `${currentHeight + 32}px`;
}

export function focusOnNewCheckbox(newCheckbox) {
    const newCheckboxText = newCheckbox.querySelector('.checkbox-text');
    newCheckboxText.focus();

    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(newCheckboxText);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

export function splitTextAtCursor(checkboxText, cursorPosition) {
    const remainingText = checkboxText.textContent.slice(cursorPosition);
    checkboxText.textContent = checkboxText.textContent.slice(0, cursorPosition);
    return remainingText;
}

function adjustCheckboxPosition(newCheckbox, referenceCheckbox, offset) {
    const currentTransform = referenceCheckbox.style.transform;
    const currentY = parseFloat(currentTransform.match(/translateY\((-?\d+)px\)/)?.[1] || 0);
    newCheckbox.style.transform = `translateY(${currentY + offset}px)`;
}

export function createAndInsertNewCheckbox(oneCheckbox, remainingText) {
    const newCheckbox = createCheckbox(false);
    adjustCheckboxPosition(newCheckbox, oneCheckbox, 32);

    const parent = oneCheckbox.parentNode;
    const currentHeight = parseFloat(parent.style.height) || 32;

    parent.insertBefore(newCheckbox, oneCheckbox.nextElementSibling);
    parent.style.height = `${currentHeight + 32}px`;

    newCheckbox.querySelector('.checkbox-text').textContent = remainingText;
    return newCheckbox;
}

export function clearCheckboxesContainer() {
    dom.checkboxesContainer.innerHTML = '';
    dom.checkboxesContainer.removeAttribute('style');
    dom.inputNoteCreate.style.removeProperty('display');
}

function shiftAllCheckboxes(startingCheckbox, distance, direction) {
    let checkbox = startingCheckbox;
    const directionMultiplier = direction === 'down' ? 1 : -1;

    while (checkbox) {
        if (checkbox.classList.contains('checkbox')) {
            const currentTransform = checkbox.style.transform;
            const match = currentTransform.match(/translateY\((-?\d+)px\)/);
            let currentY = 0;

            if (match) {
                currentY = parseFloat(match[1]);
            }

            checkbox.style.transform = `translateY(${currentY + (distance * directionMultiplier)}px)`;
        }
        checkbox = checkbox.nextElementSibling;
    }
}

export function shiftAllCheckboxesDown(startingCheckbox, distance = 32) {
    shiftAllCheckboxes(startingCheckbox, distance, 'down');
}

export function shiftAllCheckboxesUp(startingCheckbox, distance = 32) {
    shiftAllCheckboxes(startingCheckbox, distance, 'up');
}

export function positionAllCheckboxes(startingCheckbox, distance = 32) {
    let checkbox = startingCheckbox;
    let index = 0;

    while (checkbox) {
        if (checkbox.classList.contains('checkbox')) {
            const currentShift = distance * index;
            checkbox.style.transform = `translateY(${currentShift}px)`;
            index++;
        }
        checkbox = checkbox.nextElementSibling;
    }
}