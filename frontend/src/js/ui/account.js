import { createElement, dom } from '../ui.js';

import { handleSignOutButtonClick, handleSignUpButtonClick, handleEditAccountClick } from '../handlers.js';

import { getAccessToken, getUserInfo } from '../backend.js';

export async function createAccountContainer() {
    const accountContainer = createElement('div', 'account-container');
    const btnCloseAccount = createCloseAccountButton();
    const accountContent = createElement('div', 'account-content');

    let isAuthorized = false;
    let userData = null;

    try {
        const token = await getAccessToken();
        isAuthorized = token ? true : false;
        userData = isAuthorized ? await getUserInfo(token) : null;
    } catch (error) {
        console.log('Error: ', error);
    }

    if (userData) {
        accountContent.appendChild(createEmailContainer(userData.email));
    }

    const accountInfo = createAccountInfo(isAuthorized, userData);
    const accountManage = createAccountManageSection(isAuthorized);

    const account = createElement('div', 'account');
    account.appendChild(accountInfo);
    account.appendChild(accountManage);

    accountContent.appendChild(account);

    accountContainer.appendChild(btnCloseAccount);
    accountContainer.appendChild(accountContent);
    dom.userAccount.appendChild(accountContainer);
}
 
function createCloseAccountButton() {
    const btnCloseAccount = createElement('button', 'btn-close-account');
    btnCloseAccount.role = 'button';
    btnCloseAccount.addEventListener('click', hideAccountContainer);

    const closeIcon = createElement('i', 'fa-solid fa-xmark fa-xl');
    btnCloseAccount.appendChild(closeIcon);

    return btnCloseAccount;
}

function createEmailContainer(email) {
    const emailContainer = createElement('div', 'email-container');
    const emailText = createElement('div', 'email-text', email);
    emailContainer.appendChild(emailText);

    return emailContainer;
}

function createAccountInfo(isAuthorized, userData) {
    const accountImageIcon = createElement('i', 'fa-solid fa-circle-user');
    const accountImage = createElement('div', 'account-image');
    accountImage.appendChild(accountImageIcon);

    const accountNickname = createElement('div', 'account-nickname', getGreetingText(userData));
    
    const accountInfo = createElement('div', 'account-info');
    accountInfo.appendChild(accountImage);
    accountInfo.appendChild(accountNickname);

    if (!isAuthorized) {
        const accountDescription = createElement('div', 'account-description', 'Please sign in or create an account to save your notes.');
        accountInfo.appendChild(accountDescription);
    }

    return accountInfo;
}

function getGreetingText(userData) {
    if (userData) {
        let userName = userData.first_name;

        if (userData.last_name !== '') {
            userName += ` ${userData.last_name}!`;
        } else {
            userName += '!';
        }

        return `Hi, ${userName}`;
    } else {
        return 'Welcome!';
    }
}

function createAccountManageSection(isAuthorized) {
    const accountManage = createElement('div', 'account-manage');

    if (isAuthorized) {
        const editAccountButton = createEditAccountButton();
        const signOutButton = createSignOutButton();
        accountManage.appendChild(editAccountButton);
        accountManage.appendChild(signOutButton);
    } else {
        const signUpButton = createSignUpButton();

        accountManage.style.display = 'flex';
        accountManage.style.justifyContent = 'center';
        accountManage.style.marginTop = '25px';

        accountManage.appendChild(signUpButton);
    }

    return accountManage;
}

function createEditAccountButton() {
    const editAccountButton = createElement('div', 'btn-edit-account', 'Manage your account');
    editAccountButton.role = 'button';
    editAccountButton.addEventListener('click', handleEditAccountClick);
    return editAccountButton;
}

function createSignOutButton() {
    const signOutIcon = createElement('i', 'fa-solid fa-arrow-right-from-bracket');
    const signOutIconContainer = createElement('div', 'signout-icon');
    signOutIconContainer.appendChild(signOutIcon);

    const signOutText = createElement('div', 'signout-text', 'Sign Out');
    const signOutButton = createElement('div', 'btn-signout');
    signOutButton.role = 'button';
    signOutButton.addEventListener('click', handleSignOutButtonClick);

    signOutButton.appendChild(signOutIconContainer);
    signOutButton.appendChild(signOutText);

    return signOutButton;
}

function createSignUpButton() {
    const signUpButton = createElement('div', 'btn-signup', 'Sign Up / Sign In');
    signUpButton.role = 'button';
    signUpButton.addEventListener('click', handleSignUpButtonClick);

    return signUpButton;
}

export function clearAccountContainer() {
    dom.userAccount.innerHTML = '';
}

export function hideAccountContainer() {
    dom.userAccount.style.visibility = 'hidden';
    dom.userAccount.style.height = '0px';
    dom.userAccount.style.removeProperty('min-height');
}

export function showAccountContainer() {
    dom.userAccount.style.visibility = 'visible';
    dom.userAccount.style.height = '365px';
    dom.userAccount.style.minHeight = '210px';
}