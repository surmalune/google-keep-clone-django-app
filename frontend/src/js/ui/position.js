import { dom, state } from '../ui.js';

export function positionElement(box, button) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const buttonRect = button.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    let newLeft = buttonRect.left + window.scrollX + 20;
    if (newLeft + boxRect.width > windowWidth) {
        newLeft = windowWidth - boxRect.width - 20;
    }

    let newTop = buttonRect.bottom + window.scrollY;
    if (newTop + boxRect.height > windowHeight) {
        newTop = windowHeight - boxRect.height - 10;
    }

    box.style.top = `${newTop}px`;
    box.style.left = `${newLeft}px`;
}

export function updateVisibility() {
    const hasPinned = document.querySelectorAll('.box-note i[title="Unpin note"]').length > 0;
    const hasOthers = document.querySelectorAll('.box-note i[title="Pin note"]').length > 0;

    dom.pinnedText.style.visibility = hasPinned ? 'visible' : 'hidden';
    dom.othersText.style.visibility = hasOthers && hasPinned ? 'visible' : 'hidden';
}

export function updateNotePositions() {
    const notes = Array.from(dom.notesCatalog.querySelectorAll('.box-note'));
    const containerWidth = dom.notesContainer.clientWidth;
    const noteWidth = notes.length > 0 ? notes[0].offsetWidth : 240;
    const noteMargin = 16;
    const textMarginBottom = 8;

    const columnYPositions = new Array(Math.floor(containerWidth / (noteWidth + noteMargin))).fill(0);

    let currentX = 0;

    // Обработка закрепленных заметок
    notes.filter(note => {
        const pinIcon = note.querySelector('.pin-icon');
        return pinIcon && pinIcon.title === 'Unpin note';
    }).forEach(note => {
        const noteHeight = note.offsetHeight;
        let currentY = columnYPositions[currentX / (noteWidth + noteMargin)] || dom.pinnedText.offsetHeight + noteMargin + textMarginBottom;

        note.style.transform = `translate(${currentX}px, ${currentY}px)`;

        columnYPositions[currentX / (noteWidth + noteMargin)] = currentY + noteHeight + noteMargin;
        currentX += noteWidth + noteMargin;

        if (currentX + noteWidth + noteMargin > containerWidth) {
            currentX = 0;
        }
    });

    // Позиционирование надписи Others только если она видима
    const hasOthers = notes.filter(note => {
        const pinIcon = note.querySelector('.pin-icon');
        return !pinIcon || pinIcon.title !== 'Unpin note';
    }).length > 0;
    if (hasOthers) {
        const maxPinnedY = Math.max(...columnYPositions);
        dom.othersText.style.transform = `translate(0px, ${maxPinnedY}px)`;

        // Обновление y-позиции для незакрепленных заметок
        columnYPositions.fill(maxPinnedY + dom.othersText.offsetHeight + noteMargin + textMarginBottom);
    } else {
        const maxPinnedY = Math.max(...columnYPositions);
        dom.notesContainer.style.height = `${maxPinnedY + 20}px`;
        return;
    }

    // Обработка незакрепленных заметок
    currentX = 0;
    notes.filter(note => {
        const pinIcon = note.querySelector('.pin-icon');
        return !pinIcon || pinIcon.title !== 'Unpin note';
    }).forEach(note => {
        const noteHeight = note.offsetHeight;

        let currentY = columnYPositions[currentX / (noteWidth + noteMargin)];

        note.style.transform = `translate(${currentX}px, ${currentY}px)`;

        columnYPositions[currentX / (noteWidth + noteMargin)] = currentY + noteHeight + noteMargin;
        currentX += noteWidth + noteMargin;

        if (currentX + noteWidth + noteMargin > containerWidth) {
            currentX = 0;
        }
    });

    const maxNoteYPosition = Math.max(...columnYPositions);
    dom.notesContainer.style.height = `${maxNoteYPosition + 20}px`;
    console.log('end position notes');
}

export function getFactWidthForList() {
    const containerWidth = window.innerWidth - state.offsetMenuWidth;
    const maxWidth = 632;

    return containerWidth <= maxWidth ? containerWidth * 0.96 : maxWidth;
}

export function adjustNoteEditBoxWidth() {
    const note = dom.noteEditContainer.querySelector('.box-note');
    if (note) {
        const screenWidth = window.innerWidth;
        note.style.width = screenWidth >= 715 ? '600px' : '85vw';
    }
}

export function updateListNotesContainerWidth() {
    state.isOneNoteInRow = true;
    const factWidth = getFactWidthForList();

    const notes = Array.from(document.querySelectorAll('.box-note'));
    notes.forEach(note => {
        note.style.width = `${factWidth - 32}px`;
    });

    dom.noteCreate.style.width = `${factWidth - 32}px`;
    dom.notesCatalog.style.width = `${factWidth}px`;
    updateNotePositions();
}

export function updateGridNotesContainerWidth() {
    const containerWidth = window.innerWidth - state.offsetMenuWidth;
    const noteWidth = 240;
    const noteMargin = 16;

    let notesQuantity = Math.floor((containerWidth - noteMargin) / (noteWidth + noteMargin));
    let factWidth = notesQuantity * (noteWidth + noteMargin) + noteMargin;
    
    if (localStorage.getItem('displayMode') === 'list' || notesQuantity === 1 || (notesQuantity === 2 && containerWidth === factWidth)) {
        updateListNotesContainerWidth();
    }
    else {
        state.isOneNoteInRow = false;
        if (containerWidth === factWidth) {
            notesQuantity--;
            factWidth = notesQuantity * (noteWidth + noteMargin) + noteMargin;
        }

        dom.noteCreate.style.width = `${getFactWidthForList() - 32}px`;
        dom.notesCatalog.style.width = `${factWidth}px`;
        
        const notes = Array.from(dom.notesCatalog.querySelectorAll('.box-note'));
        notes.forEach(note => {
            note.style.width = `${240}px`
        });

        updateNotePositions();
    }
}