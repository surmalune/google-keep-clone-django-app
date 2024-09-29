import { unfoldNoteInput, foldNoteInput, updateContentUIFromHash, loadDisplayMode, loadTheme, state, dom } from './ui.js';

import { moveToTrashNote, archiveNote, restoreNote, deleteNoteOnServer, searchNotes, ListItem, Note, loginUser, 
    registerUser, createNote, updateNoteOnServer, checkIfEmailExistsAlready, updateCheckbox, deleteCheckbox,
    updateUser } from './backend.js';

import { createSignUpWindow, showLoginForm, showRegistrationForm, getTokenOrRedirect } from './ui/auth.js';

import { createCheckbox, insertNewCheckbox, focusOnNewCheckbox, splitTextAtCursor, createAndInsertNewCheckbox, 
    clearCheckboxesContainer, shiftAllCheckboxesDown, shiftAllCheckboxesUp } from './ui/checkbox.js';

import { setupNoteEditElements, pinNote, updateNoteEditIcons, updateNoteColor, updateNoteTitle,
    updateNoteText, updateCheckboxes, updateImages, handleEmptyNote, resetNoteState } from './ui/editor.js';

import { addNoteToList, fillNotesContainer, deleteNoteFromContainer } from './ui/note.js';

import { createAccountContainer, hideAccountContainer, clearAccountContainer, showAccountContainer } from './ui/account.js';

import { positionElement, updateVisibility, updateNotePositions, adjustNoteEditBoxWidth,
    updateListNotesContainerWidth, updateGridNotesContainerWidth } from './ui/position.js';

import { createImagesContainer, clearContainer, initImageFileInput } from './ui/image.js';

import { updateSelectedCount, hideSelectMode, modifySelectedNotes } from './ui/selection.js';

import { openSettingMenu, createSettingMenu } from './ui/settings.js';

import { createColorToolbar, applyColorToNotes } from './ui/color.js';

export function initHandlers() {
    window.addEventListener('hashchange', updateContentUIFromHash);

    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
      
        if (window.scrollY > 0) {
          header.classList.add('has-shadow');
        } else {
          header.classList.remove('has-shadow');
        }
    });

    window.addEventListener('resize', (event) => {
        adjustNoteEditBoxWidth();
        updateGridNotesContainerWidth();

        const settingMenu = document.querySelector('.setting-menu');
        if (settingMenu) {
            const windowWidth = window.innerWidth;
            const settingButtonRect = dom.btnSettings.getBoundingClientRect();
            const settingMenuPlace = settingMenu.getBoundingClientRect();
    
            let newLeft = settingButtonRect.left + window.scrollX;
            if (newLeft + settingMenuPlace.width > windowWidth) {
                newLeft = windowWidth - settingMenuPlace.width - 20;
            }
    
            settingMenu.style.top = `${settingButtonRect.bottom + window.scrollY}px`;
            settingMenu.style.left = `${newLeft}px`;
        }
    });

    window.addEventListener('load', (event) => {
        adjustNoteEditBoxWidth();

        if (window.innerWidth >= 610) {
            updateGridNotesContainerWidth();
        }
        else {
            updateListNotesContainerWidth();
        }
    });

    document.addEventListener('click', (event) => {
        handleClickOutsideNoteForm(event);
        handleClickOutsideChangeBackground(event);
        handleClickOutsideUserAccount(event);
        handleClickOutsideSelectMode(event);
        handleClickOutsideSettingMenu(event);
    });

    dom.btnMenuArchive.addEventListener('click', () => {
        window.location.hash = 'archive';
    });
    
    dom.btnMenuTrash.addEventListener('click', () => {
        window.location.hash = 'trash';
    });
    
    dom.btnMenuNotes.addEventListener('click', () => {
        window.location.hash = 'home';
    });

    dom.inputNoteCreate.addEventListener('focus', () => {
        if (!state.isNoteInputUnfolded) {
            unfoldNoteInput();
        }
    });

    dom.inputNoteCreate.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    dom.inputTitleCreate.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            dom.inputNoteCreate.focus();
        }
    });

    dom.inputSearch.addEventListener('focus', (event) => {
        dom.btnClearSearch.style.visibility = 'visible';
        window.location.hash = 'search';
    });

    dom.inputSearch.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            const searchText = dom.inputSearch.value.trim();
            if (searchText !== '') {

                let token = await getTokenOrRedirect();
                if (!token) return;

                // TODO: дублирование
                dom.notesContainer.innerHTML = '';
                dom.notesContainer.style.removeProperty('height');
                dom.noteCreate.style.display = 'none';
                
                dom.notesContainer.appendChild(dom.pinnedText);
                dom.notesContainer.appendChild(dom.othersText);

                try {
                    const data = await searchNotes(searchText, token);
                    fillNotesContainer(data);
                } catch(error) {
                    console.log('Error: ', error);
                }
            }
        }
    });

    dom.btnClearSearch.addEventListener('click', function(event) {
        event.preventDefault();
        if (dom.inputSearch.value.trim() !== '') {
            dom.inputSearch.value = '';
            dom.inputSearch.focus();
        }
        else {
            dom.btnClearSearch.style.visibility = 'hidden';
            window.location.hash = 'home';

            dom.searchContainer.style.removeProperty('display');
            dom.formSearch.style.removeProperty('background-color');
        }
    });

    dom.btnClearSelection.addEventListener('click', () => {
        hideSelectMode();
        state.selectedCount = 0;
    });

    dom.btnMenuToggle.addEventListener('click', () => {
        if (window.innerWidth >= 600) {
            state.offsetMenuWidth = state.isMenuOpen ? 80 : 280;
    
            if (localStorage.getItem('displayMode') === 'list') {
                updateListNotesContainerWidth();
            }
            else {
                updateGridNotesContainerWidth();
            }
        }

        dom.sidebarNav.classList.toggle('open');
        dom.sideBar.classList.toggle('open');
        state.isMenuOpen = !state.isMenuOpen;
    });

    dom.btnViewToggle.addEventListener('click', () => {
        if (localStorage.getItem('displayMode') === 'list') {
            dom.btnViewToggle.querySelector('i').className = 'fa-solid fa-table-list fa-lg';
            dom.btnViewToggle.title = 'List view';
            localStorage.setItem('displayMode', 'grid');
            updateGridNotesContainerWidth();
        } else {
            dom.btnViewToggle.querySelector('i').className = 'fa-solid fa-table fa-lg';
            dom.btnViewToggle.title = 'Grid view';
            localStorage.setItem('displayMode', 'list');
            updateListNotesContainerWidth();
        }
    });

    dom.overlay.addEventListener('click', (event) => {
        if (state.isNoteModificationMode) {
            submitNoteModifications();
        }

        if (state.isSettingWindowOpen) {
            document.querySelector('.settings-window').style.display = 'none';
            state.isSettingWindowOpen = false;
        }

        const signUpWindow = document.querySelector('.signup-window');
        if (signUpWindow) {
            document.body.removeChild(signUpWindow);
        }

        dom.overlay.style.display = 'none';
        document.body.style.removeProperty('overflow-y');
        event.stopPropagation();
    });

    dom.btnEmptyTrash.addEventListener('click', async () => {
        try {
            let token = await getTokenOrRedirect();
            if (!token) return;

            const notes = Array.from(dom.notesContainer.querySelectorAll('.box-note'));
            await Promise.all(notes.map(async note => {
                const noteId = note.getAttribute('data-id');
                await deleteNoteOnServer(noteId, token);
                deleteNoteFromContainer(note);
            }));
    
            dom.notesContainer.style.removeProperty('height');
        } catch(error) {
            console.log('Error: ', error);
        }
    });

    dom.btnImageCreate.addEventListener('click', () => {
        initImageFileInput(dom.imagesContainer);
        if (!state.isNoteInputUnfolded) {
            unfoldNoteInput();
        }
    });

    dom.btnListCreate.addEventListener('click', () => {
        if (state.isListItemsAddMode) {
            return;
        }
        state.isListItemsAddMode = true;

        unfoldNoteInput();
        dom.inputNoteCreate.style.display = 'none';

        dom.checkboxesContainer.style.display = 'block';
        dom.checkboxesContainer.style.height = '32px';

        dom.checkboxesContainer.appendChild(createCheckbox(true));
        dom.formNoteCreate.insertBefore(dom.checkboxesContainer, dom.inputGroupCreate);
    });

    dom.btnLogin.addEventListener('click', (event) => {
        event.preventDefault();
        showAccountContainer();
        clearAccountContainer();
        createAccountContainer();
    });

    dom.btnSettings.addEventListener('click', () => {
        if (state.isSettingMenuOpen) {
            return;
        }
        state.isSettingMenuOpen = true;

        let settingMenu = document.querySelector('.setting-menu');
        if (!settingMenu) {
            settingMenu = createSettingMenu();
            document.body.appendChild(settingMenu);
        }
        else {
            openSettingMenu(settingMenu);
        }

        positionElement(settingMenu, dom.btnSettings);
    });

    dom.btnEnterSearch.addEventListener('click', async function(event) {
        event.preventDefault();

        if (window.innerWidth < 795) {
            dom.searchContainer.style.display = 'block';
            dom.formSearch.style.backgroundColor = 'var(--search-form-bc)';
        }

        const searchText = dom.inputSearch.value.trim();
        if (searchText === '') {
          if (document.activeElement !== dom.inputSearch) {
            dom.inputSearch.focus();
          }
        }
        else {
            try {
                let token = await getTokenOrRedirect();
                if (!token) return;
            } catch(error) {
                console.log('Error: ', error);
            }

            // TODO: дублирование
            dom.notesContainer.innerHTML = '';
            dom.notesContainer.style.removeProperty('height');
            dom.noteCreate.style.display = 'none';
    
            dom.notesContainer.appendChild(dom.pinnedText);
            dom.notesContainer.appendChild(dom.othersText);

            try {
                const data = await searchNotes(searchText, token);
                fillNotesContainer(data);
            } catch(error) {
                console.log('Error: ', error);
            }
        }
    });

    dom.formNoteCreate.addEventListener('submit', (event) => {
        event.preventDefault();
        submitNote();
    });

    dom.btnBackgroundCreate.addEventListener('click', handleOneNoteColorClick);
}

function handleClickOutsideNoteForm(event) {
    if (!event.target.closest('#note-form') && state.isNoteInputUnfolded) {
        submitNote();
        foldNoteInput();
    }
}

function handleClickOutsideChangeBackground(event) {
    const changeBackground = document.querySelector('.change-background');
    if (changeBackground && !changeBackground.contains(event.target)) {
        changeBackground.remove();
    }
}

function handleClickOutsideUserAccount(event) {
    if (!dom.userAccount.contains(event.target) && !dom.btnLogin.contains(event.target)) {
        hideAccountContainer();
    }
}

function handleClickOutsideSelectMode(event) {
    const selectIconClicked = event.target.closest('.select-note-icon');
    const clickedInsideSelectHeader = dom.headerSelection.contains(event.target);
    if (!clickedInsideSelectHeader && !selectIconClicked) {
        hideSelectMode();
        state.selectedCount = 0;
    }
}

function handleClickOutsideSettingMenu(event) {
    const settingMenu = document.querySelector('.setting-menu');
    if (state.isSettingMenuOpen && !dom.btnSettings.contains(event.target)) {
        state.isSettingMenuOpen = false;
        settingMenu.style.display = 'none';
        settingMenu.tabIndex = '-1';
    }
}

function removeFromArray(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function handleThemeMenuItemClick(event) {
    document.body.classList.toggle('dark-theme');
    if (localStorage.getItem('theme') === 'light') {
        localStorage.setItem('theme', 'dark');
    }
    else {
        localStorage.setItem('theme', 'light');
    }
}

export function handleSignUpButtonClick(event) {
    clearAccountContainer();
    hideAccountContainer();

    dom.overlay.style.display = 'block';
    document.body.style.overflowY = 'hidden';

    const signUpWindow = createSignUpWindow();
    document.body.appendChild(signUpWindow);
}

export async function handleEmailCheckClick(event) {
    event.preventDefault();
    const signUpInputContainer = event.target.closest('.signup-form').querySelector('.signup-input-container');
    const emailInput = signUpInputContainer.querySelector('.email-input');
    const signUpSubmitButton = signUpInputContainer.closest('.signup-form').querySelector('.signup-submit-button');

    try {
        const data = await checkIfEmailExistsAlready(emailInput.value.trim());

        if (data.error) {
            console.log('email error', data.error);
        } 
        else if (data.exists) {
            showLoginForm(signUpInputContainer);
            signUpSubmitButton.addEventListener('click', handleLoginClick);
            signUpSubmitButton.removeEventListener('click', handleEmailCheckClick);
        }
        else {
            showRegistrationForm(signUpInputContainer);
            signUpSubmitButton.addEventListener('click', handleRegisterClick);
            signUpSubmitButton.removeEventListener('click', handleEmailCheckClick);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

export function handleTitleEditInput(event) {
    const titleTextInput = event.target;
    const titlePlaceHolder = event.target.closest('.note-title-text').querySelector('.title-placeholder');
    if (titleTextInput.textContent.trim() === '') {
        titlePlaceHolder.style.display = 'block';
    } 
    else {
        titlePlaceHolder.style.display = 'none';
    }
}

export function handleTitleEditKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.closest('.note').querySelector('.note-text-input').focus();
    }
}

export function handleTextEditInput(event) {
    const textEdit = event.target;
    const textPlaceHolder = event.target.closest('.note-text').querySelector('.text-placeholder');
    if (textEdit.textContent.trim() === '') {
        textPlaceHolder.style.display = 'block';
    } 
    else {
        textPlaceHolder.style.display = 'none';
    }
}

export function handleEmptyCheckboxKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
}

export function handleCheckboxFocus(event) {
    event.target.parentNode.querySelector('.checkbox-delete-button').style.opacity = '1';
}

export function handleCheckboxBlur(event) {
    event.target.parentNode.querySelector('.checkbox-delete-button').style.removeProperty('opacity');
}

export function handleImageIconClick(event, imagesContainer) {
    const file = event.target.files[0];

    if (!file) {
        // TODO:
        alert('No file selected');
        return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        // TODO:
        alert('File is too large. Maximum allowed size is 10MB.');
        return;
    }

    const img = new Image();
    img.onload = function() {
        const maxPixels = 25 * 1024 * 1024;
        const pixels = this.width * this.height;

        if (pixels > maxPixels) {
            alert('Image resolution is too high. Maximum allowed resolution is 25 megapixels.');
            return;
        }

        createImagesContainer(this, imagesContainer);
        updateNotePositions();
    };
    
    img.src = URL.createObjectURL(file);
}

export function handleOneNoteColorClick(event) {
    const targetElement = event.target.closest('.box-note, #note-form');
    const choosenColor = targetElement.getAttribute('data-color') || 'none';
    createColorToolbar(event, choosenColor, false);
    event.stopPropagation();
}

export function handleSelectClick(event) {
    const selectIcon = event.currentTarget;
    const note = event.currentTarget.closest('.box-note');
    const isSelected = note.getAttribute('data-selected') === 'true';

    if (state.selectedCount === 0) {
        dom.headerSelection.style.display = 'flex';
        dom.headerSelection.style.opacity = '1';
        dom.headerSelection.style.transform = 'translateY(0)';
    }

    if (isSelected) {
        note.classList.remove('selected');
        note.setAttribute('data-selected', 'false');
        selectIcon.classList.remove('visible');
        state.selectedCount--;
        removeFromArray(state.selectedNotes, note);
    } else {
        note.classList.add('selected');
        note.setAttribute('data-selected', 'true');
        selectIcon.classList.add('visible');
        state.selectedCount++;
        state.selectedNotes.push(note);
    }

    if (state.selectedCount === 0) {
        hideSelectMode();
    }

    updateSelectedCount(state.selectedCount);
}

export async function handleMoveToTrashClick(event) {
    const note = event.target.closest('.box-note');
    const noteId = note.getAttribute('data-id');

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        moveToTrashNote(noteId, token);
    } catch(error) {
        console.log('Error: ', error);
    }

    deleteNoteFromContainer(note);
}

export async function handleArchiveClick(event) {
    const note = event.target.closest('.box-note');
    const noteId = note.getAttribute('data-id');
    const isArchived = event.target.title === 'Archive' ? true : false;

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        await archiveNote(noteId, isArchived, token);
    } catch(error) {
        console.log('Error: ', error);
    }

    deleteNoteFromContainer(note);
}

export async function handleRestoreClick(event) {
    const noteElement = event.target.closest('.box-note');
    const noteId = noteElement.getAttribute('data-id');

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        restoreNote(noteId, token);
    } catch(error) {
        console.log('Error: ', error);
    }

    deleteNoteFromContainer(noteElement);
}

export async function handleDeleteForeverClick(event) {
    const note = event.target.closest('.box-note');
    const noteId = note.getAttribute('data-id');

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        await deleteNoteOnServer(noteId, token);
    } catch(error) {
        console.log('Error: ', error);
    }

    deleteNoteFromContainer(note);
}
 
export async function handlePinIconClick(event) {
    const note = event.target.closest('.box-note');
    await pinNote(note, event.target);
    updateVisibility();
    updateNotePositions();
}

export function handleNoteEditClick(event) {
    // TODO:
    if (event.target.classList.contains('pin-icon') 
        || event.target.classList.contains('check-icon') 
        || event.target.classList.contains('new-checkbox-icon')
        || (event.target.classList.contains('img-delete'))) {
        return;
    }

    state.isNoteModificationMode = true;

    // TODO: currentNote => backend note.id
    state.currentNote = Array.from(event.target.closest('.note').children).find(child => 
        child.classList.contains('text-and-title-note'));

    dom.overlay.style.display = 'block';
    document.body.style.overflowY = 'hidden';

    const originalBoxNote = state.currentNote.closest('.box-note');
    const noteEdit = originalBoxNote.cloneNode(true);
    noteEdit.style.transform = 'none';
    noteEdit.style.position = 'relative';
    noteEdit.style.margin = '0';
    noteEdit.querySelector('.text-and-title-note').style.overflowY = 'auto';
    noteEdit.querySelector('.text-and-title-note').style.maxHeight = '482px';
    originalBoxNote.style.opacity = '0';

    updateNoteEditIcons(noteEdit);
    setupNoteEditElements(originalBoxNote, noteEdit);

    dom.noteEditContainer.style.display = 'block';
    dom.noteEditContainer.appendChild(noteEdit);
    document.body.appendChild(dom.noteEditContainer);
    adjustNoteEditBoxWidth();        
}

export function handleColorOptionClick(event, note = null) {
    const colorOption = event.target.closest('.color-option');
    highlightChosenColor(colorOption);
    applyColorToNotes(note ? [note] : state.selectedNotes, colorOption.className.split(' ')[1]);
    event.stopPropagation();
}

function highlightChosenColor(selectedOption) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('chosen');
        option.querySelector('.select-color-icon').style.display = 'none';
    });

    selectedOption.classList.add('chosen');
    selectedOption.querySelector('.select-color-icon').style.display = 'inline-block';
}

export function handleCheckboxKeydown(event) {
    const checkboxText = event.target;
    const oneCheckbox = checkboxText.closest('.checkbox');

    if (event.key === 'Enter') {
        event.preventDefault();
        const cursorPosition = window.getSelection().getRangeAt(0).endOffset;
        const cursorAtEnd = cursorPosition === checkboxText.textContent.length;
        
        // TODO
        const nextCheckbox = oneCheckbox.nextElementSibling;
        if (nextCheckbox && nextCheckbox.classList.contains('checkbox')) {

            if (nextCheckbox.classList.contains('empty-checkbox') && cursorAtEnd) {
                nextCheckbox.querySelector('.checkbox-text').focus();
            } else {
                const remainingText = splitTextAtCursor(checkboxText, cursorPosition);
                shiftAllCheckboxesDown(nextCheckbox, 32);
        
                const newCheckbox = createAndInsertNewCheckbox(oneCheckbox, remainingText);
                newCheckbox.querySelector('.checkbox-text').focus();;
            }
        }
    }
}

export async function handleCheckboxIconClick(event) {
    const icon = handleEditorCheckboxClick(event);
    const itemId = icon.closest('.checkbox').getAttribute('data-listitem-id');
    if (itemId) {
        const isChecked = icon.classList.contains('fa-square-check');
        const payload = {
            is_checked: isChecked
        };

        try {
            let token = await getTokenOrRedirect();
            if (!token) return;

            const data = await updateCheckbox(itemId, payload, token);
            console.log('Success:', data);
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

export function handleEditorCheckboxClick(event) {
    const icon = event.target;
    const text = icon.closest('.checkbox').querySelector('.checkbox-text');

    if (icon.classList.contains('fa-square')) {
        icon.classList.remove('fa-square');
        icon.classList.add('fa-square-check');
        text.style.textDecoration = 'line-through';
        text.style.opacity = '0.7';
    }
    else {
        icon.classList.remove('fa-square-check');
        icon.classList.add('fa-square');
        text.style.removeProperty('text-decoration');
        text.style.opacity = '1';
    }
    return icon;
}

export async function handleCheckboxDeleteClick(event) {
    const checkbox = event.target.closest('.checkbox');
    const currentHeight = parseFloat(checkbox.parentNode.style.height) || 32;
    checkbox.parentNode.style.height = `${currentHeight - 32}px`;

    const next = checkbox.nextElementSibling;
    const prev = checkbox.previousElementSibling;
    if (prev) {
        prev.querySelector('.checkbox-text').focus();
    }
    else {
        next.querySelector('.checkbox-text').focus();
    }
    checkbox.parentNode.removeChild(checkbox);

    shiftAllCheckboxesUp(next, 32);
}

export function handleCheckboxBackspace(event) {
    const text = event.target;
    const container = text.closest('.checkboxes-container');
    
    if (event.key === 'Backspace' && text.textContent.trim() === '') {
        if (container.childElementCount > 2) {
            handleCheckboxDeleteClick(event);
        }
    }
}

export function handleEmptyCheckboxInput(event) {
    const text = event.target;
    const checkbox = text.closest('.checkbox');

    if (text.textContent.trim().length > 0) {
        const newCheckbox = createCheckbox(false, false, text.textContent);
        newCheckbox.style.transform = checkbox.style.transform;

        insertNewCheckbox(checkbox, newCheckbox);
        shiftAllCheckboxesDown(checkbox);
        focusOnNewCheckbox(newCheckbox);

        text.textContent = '';
    }
}

export async function handleLoginClick(event) {
    event.preventDefault();

    const container = event.target.closest('.signup-form').querySelector('.signup-input-container');
    const email = container.querySelector('.email-input');
    const password = container.querySelector('.password-input');

    const emailError = container.querySelector('.email-error');
    emailError.textContent = '';

    try {
        await loginUser(email.value.trim(), password.value.trim());
        dom.overlay.click();
        updateContentUIFromHash();
    } catch(error) {
        handleLoginErrors(error, emailError);
    }
}

export async function handleRegisterClick(event) {
    event.preventDefault();
    const container = event.target.closest('.signup-form').querySelector('.signup-input-container');
    const emailError = container.querySelector('.email-error');
    const passwordError = container.querySelector('.password-error');
    const confirmError = container.querySelector('.confirm-error');
    const firstNameError = container.querySelector('.first-name-error');
    const lastNameError = container.querySelector('.last-name-error');

    clearMessages([emailError, passwordError, confirmError, firstNameError, lastNameError]);

    const userData = {
        email: container.querySelector('.email-input').value.trim(),
        password: container.querySelector('.password-input').value.trim(),
        password2: container.querySelector('.confirm-input').value.trim(),
        first_name: container.querySelector('.first-name-input').value.trim(),
        last_name: container.querySelector('.last-name-input').value.trim(),
    };

    try {
        await registerUser(userData);
        await loginUser(userData.email, userData.password);
        dom.overlay.click();
        updateContentUIFromHash();
    } catch (error) {
        handleRegistrationErrors(error, { emailError, passwordError, confirmError, firstNameError, lastNameError });
    }
}

function clearMessages(messages) {
    messages.forEach(message => message.textContent = '');
}

function handleRegistrationErrors(errors, errorElements) {
    if (!errors) return;

    if (errors.email) errorElements.emailError.textContent = errors.email.join(' ');
    if (errors.password) errorElements.passwordError.textContent = errors.password.join(' ');
    if (errors.password2) errorElements.confirmError.textContent = errors.password2.join(' ');
    if (errors.first_name) errorElements.firstNameError.textContent = errors.first_name.join(' ');
    if (errors.last_name) errorElements.lastNameError.textContent = errors.last_name.join(' ');
    if (errors.detail) errorElements.emailError.textContent = errors.detail;
}

function handleLoginErrors(errors, errorContainer) {
    if (!errors) return;
    
    errorContainer.textContent = errors;
}

export function handleSignOutButtonClick(event) {
    localStorage.clear();
    clearAccountContainer();
    hideAccountContainer();
    updateContentUIFromHash();
    loadDisplayMode();
    loadTheme();
}

export async function submitNote() {
    console.log('submitNote');
    const hasCheckboxes = dom.checkboxesContainer.childElementCount > 1;
    const hasText = dom.inputNoteCreate.value.trim() !== '';
    const hasTitle = dom.inputTitleCreate.value.trim() !== '';
    const hasImages = dom.imagesContainer.innerHTML !== '';

    if (!hasCheckboxes && !hasText && !hasTitle && !hasImages) {
        return;
    }

    let img = await getNoteFile(dom.imagesContainer);

    let note;
    if (hasCheckboxes) {
        const listItems = getListItems();
        note = createNoteObject('list', listItems, img);
    } else {
        note = createNoteObject('text', [], img);
    }

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        const data = await createNote(note, token);
        console.log("Success, note:", data);

        note.id = data.id;
        note.list_items = data.list_items;
        note.image = data.image;

        addNoteToList(note);

        updateVisibility();
        updateNotePositions();
    } catch (error) {
        console.error("Error:", error);
    }

    clearCheckboxesContainer();
    clearContainer(dom.imagesContainer);
    foldNoteInput();
}

async function getNoteFile(imagesContainer) {
    const imgElement = imagesContainer.querySelector('img');
    if (!imgElement) return null;

    if (imgElement.src.startsWith('blob:')) {
        const response = await fetch(imgElement.src);
        const blob = await response.blob();

        if (!blob || blob.size === 0) {
            console.error("Ошибка: blob пустой или не содержит данных");
            return null;
        }

        return new File([blob], 'note-image.png', { type: blob.type });
    }

    return null;
}

function getListItems() {
    return Array.from(dom.checkboxesContainer.querySelectorAll('.checkbox-text'))
        .slice(0, -1)
        .map((item, index) => {
            const checkIcon = item.closest('.checkbox').querySelector('.check-icon');
            const isChecked = checkIcon.classList.contains('fa-square-check');
            return new ListItem(null, item.textContent, index, isChecked);
        });
} 

function createNoteObject(type, listItems, img) {
    return new Note(
        null,
        dom.inputTitleCreate.value,
        dom.inputNoteCreate.value,
        type,
        dom.formNoteCreate.getAttribute('data-color'),
        'normal',
        listItems,
        img,
        null
    );
}

export async function submitNoteModifications() {
    console.log('submitNoteModifications');
    state.isNoteModificationMode = false;

    const curTitle = dom.noteEditContainer.querySelector('.title-text-input');
    const curText = dom.noteEditContainer.querySelector('.note-text-input');
    const curBoxNote = dom.noteEditContainer.querySelector('.box-note');
    const curCheckboxesContainer = dom.noteEditContainer.querySelector('.checkboxes-container');
    const curImagesContainer = dom.noteEditContainer.querySelector('.images-container');

    const originalTitle = state.currentNote.closest('.text-and-title-note');
    const originalBoxNote = state.currentNote.closest('.box-note');
    const originalText = originalTitle.querySelector('.note-text');
    const originalCheckboxesContainer = state.currentNote.querySelector('.checkboxes-container');
    const originalImagesContainer = state.currentNote.querySelector('.images-container');

    const noteId = state.currentNote.closest('.box-note').getAttribute('data-id');
    const listItems = getListItemsFrom(curCheckboxesContainer);
    const img = await getNoteFile(curImagesContainer);

    let payload = {
        title: curTitle.textContent,
        content: curText.innerText,
        list_items: listItems,
        image: img
    };

    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        const data = await updateNoteOnServer(noteId, payload, token);
        handleServerResponse(data, listItems, curCheckboxesContainer);

        updateCheckboxes(curCheckboxesContainer, originalCheckboxesContainer);
        updateImages(curImagesContainer, originalImagesContainer);

        updateVisibility();
        updateNotePositions();
    } catch (error) {
        console.error('Error:', error);
    }

    originalBoxNote.style.opacity = '1';

    updateNoteTitle(curTitle, originalTitle);
    updateNoteText(curText, originalText);
    handleEmptyNote(curText, curTitle, curCheckboxesContainer, curImagesContainer, originalCheckboxesContainer, originalBoxNote);
    updateNoteColor(originalBoxNote, curBoxNote);
    resetNoteState();
}

function getListItemsFrom(container) {
    return Array.from(container.querySelectorAll('.checkbox-text'))
        .slice(0, -1)
        .map((item, index) => {
            const itemId = item.closest('.checkbox').getAttribute('data-listitem-id');
            const isChecked = item.closest('.checkbox').querySelector('.check-icon').classList.contains('fa-square-check');
            return new ListItem(itemId, item.textContent, index, isChecked);
        });
}

function handleServerResponse(data, listItems, container) {
    console.log('Success:', data);

    data.list_items.forEach((item, index) => {
        if (!listItems[index].id) {
            const checkboxElement = container.querySelector(`.checkbox:nth-child(${index + 1})`);
            checkboxElement.setAttribute('data-listitem-id', item.id);
        }
    });
}

export function handlePinSelection() {
    state.selectedNotes.forEach(async note => {
        const pinIcon = note.querySelector('.pin-icon');
        const noteElement = pinIcon.closest('.box-note');
        await pinNote(noteElement, pinIcon);
    });
    updateVisibility();
    updateNotePositions();
    hideSelectMode();
}

export function handleBackgroundSelection(event) {
    const choosenColor = getCommonColor(state.selectedNotes) || 'no-select';
    createColorToolbar(event, choosenColor, true);
    event.stopPropagation();
}

function getCommonColor(notes) {
    if (notes.length === 0) return null;
    const firstColor = notes[0].getAttribute('data-color');
    return notes.every(note => note.getAttribute('data-color') === firstColor) ? firstColor : null;
}

export function handleArchiveSelection() {
    modifySelectedNotes({ status: 'archived' });
    hideSelectMode();
}

export function handleUnarchiveSelection() {
    modifySelectedNotes({ status: 'normal' });
    hideSelectMode();
}

export function handleDeleteSelection() {
    modifySelectedNotes({ status: 'deleted' });
    hideSelectMode();
}

export async function handleDeleteForeverSelection() {
    let token = await getTokenOrRedirect();
    if (!token) return;

    state.selectedNotes.forEach(async note => {
        const boxNote = note.closest('.box-note');
        const noteId = boxNote.getAttribute('data-id');

        try {
            await deleteNoteOnServer(noteId, token);
        } catch(error) {
            console.log('Error: ', error);
        }

        deleteNoteFromContainer(boxNote);
    });
    hideSelectMode();
}

export function handleRestoreSelection() {
    modifySelectedNotes({ status: 'normal' });
    hideSelectMode();
}

export async function handleEditAccountClick() {
    try {
        let token = await getTokenOrRedirect();
        if (!token) return;

        const data = await updateUser(token);
        console.log('data', data);
    } catch(error) {
        console.log('Error: ', error);
    }
}