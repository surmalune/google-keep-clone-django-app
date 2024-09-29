import { createElement } from '../ui.js';

import { handleImageIconClick } from '../handlers.js';

export function createImagesContainer(img, imagesContainerT) {
    console.log('createImagesContainer');

    imagesContainerT.innerHTML = '';
    imagesContainerT.style.display = 'block';
    imagesContainerT.style.paddingTop = `${(img.naturalHeight / img.naturalWidth) * 100}%`;

    const imgContainer = createElement('div', 'img-container');

    img.className = 'img';
    const imgDeleteButton = createImgDeleteButton(imagesContainerT);

    imgContainer.appendChild(img);
    imgContainer.appendChild(imgDeleteButton);

    imagesContainerT.appendChild(imgContainer);
}

function createImgDeleteButton(imagesContainer) {
    const imgDeleteButton = createElement('div', 'img-delete-button img-delete');
    imgDeleteButton.role = 'button';
    imgDeleteButton.tabIndex = '0';
    imgDeleteButton.title = 'Remove image';
    imgDeleteButton.addEventListener('click', () => clearContainer(imagesContainer));

    const imgDeleteIcon = createElement('i', 'fa-solid fa-trash img-delete');
    imgDeleteButton.appendChild(imgDeleteIcon);

    return imgDeleteButton;
}

export function clearContainer(container) {
    container.innerHTML = '';
    container.style.display = 'none';
    container.style.removeProperty('padding-top');
}

// ???
export function initImageFileInput(imagesContainer) {
    console.log('initImageFileInput');

    const fileInput = createElement('input', 'file-input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png, image/jpeg';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (e) => {
        handleImageIconClick(e, imagesContainer);
    });
    fileInput.click();
}