import { dom, createElement } from '../ui.js';

import { handleEmailCheckClick } from '../handlers.js';

import { getAccessToken } from '../backend.js';

function suggestToSignUp() {
    dom.overlay.style.display = 'block';
    document.body.style.overflowY = 'hidden';

    const signUpWindow = createSignUpWindow();
    document.body.appendChild(signUpWindow);
}
 
export function createSignUpWindow() {
    const signUpWindow = createElement('div', 'signup-window window');
    signUpWindow.style.width = '480px';

    const signUpHeader = createElement('h2', 'window-header', 'Sign Up / Sign In');
    const signUpContainer = createElement('div', 'signup-container');
    signUpContainer.style.marginTop = '12px';

    const signUpForm = createSignUpForm();
    const thirdPartyAuth = createThirdPartyAuthSection();

    signUpContainer.appendChild(signUpForm);
    signUpContainer.appendChild(thirdPartyAuth);

    signUpWindow.appendChild(signUpHeader);
    signUpWindow.appendChild(signUpContainer);

    return signUpWindow;
}

function createSignUpForm() {
    const signUpForm = createElement('form', 'signup-form');
    const signUpInputContainer = createSignUpInputContainer();
    const signUpSubmitButtonContainer = createSignUpSubmitButtonContainer();

    signUpForm.appendChild(signUpInputContainer);
    signUpForm.appendChild(signUpSubmitButtonContainer);

    return signUpForm;
}

function createSignUpInputContainer() {
    const signUpInputContainer = createElement('div', 'signup-input-container');
    const emailContainer = createInputContainer('email-input', 'Email', 'email-error');
    signUpInputContainer.appendChild(emailContainer);

    return signUpInputContainer;
}

function createSignUpSubmitButtonContainer() {
    const signUpSubmitButtonContainer = createElement('div', 'signup-submit-button-container');
    const signUpSubmitButton = createElement('button', 'signup-submit-button', 'Next');
    
    signUpSubmitButton.addEventListener('click', handleEmailCheckClick);
    signUpSubmitButtonContainer.appendChild(signUpSubmitButton);

    return signUpSubmitButtonContainer;
}

function createThirdPartyAuthSection() {
    const thirdPartyAuth = createElement('aside', 'third-party-auth');
    const separator = createElement('div', 'separator', 'or');
    const googleLoginButton = createGoogleLoginButton();

    thirdPartyAuth.appendChild(separator);
    thirdPartyAuth.appendChild(googleLoginButton);

    return thirdPartyAuth;
}

function createGoogleLoginButton() {
    const googleLoginButton = createElement('button', 'google-login-button');
    googleLoginButton.addEventListener('click', (event) => {
        event.preventDefault();
        // TODO: oauth2
    });

    const googleIcon = createElement('span', 'google-icon');
    googleLoginButton.appendChild(googleIcon);
    googleLoginButton.appendChild(document.createTextNode('Continue with Google'));

    return googleLoginButton;
}

export function showRegistrationForm(signUpInputContainer) {
    const fields = [
        { className: 'password-input', placeholder: 'Password', errorClass: 'password-error' },
        { className: 'confirm-input', placeholder: 'Confirm password', errorClass: 'confirm-error' },
        { className: 'first-name-input', placeholder: 'First name', errorClass: 'first-name-error' },
        { className: 'last-name-input', placeholder: 'Last name (optional)', errorClass: 'last-name-error' },
    ];

    fields.forEach(field => {
        const inputContainer = createInputContainer(field.className, field.placeholder, field.errorClass);
        signUpInputContainer.appendChild(inputContainer);
    });
}

export function showLoginForm(signUpInputContainer) {
    const passwordContainer = createInputContainer('password-input', 'Password', 'password-error');
    signUpInputContainer.appendChild(passwordContainer);
}

function createInputContainer(inputClass, placeholder, errorClass) {
    const container = createElement('div', 'input-container');
    const input = createElement('input', `${inputClass} signup-input`);
    input.placeholder = placeholder;

    const error = createElement('div', `${errorClass} error-message`);

    container.appendChild(error);
    container.appendChild(input);

    return container;
}

export async function getTokenOrRedirect() {
    try {
        let token = await getAccessToken();
        if (!token) {
            suggestToSignUp();
            return null;
        }
        return token;
    } catch (error) {
        console.log('Error: ', error);
    }
}

export async function getTokenOrCoverContainer() {
    try {
        let token = await getAccessToken();
        if (!token) {
            dom.notesContainer.innerHTML = '';
            dom.notesContainer.style.removeProperty('height');
            dom.messageNoContent.style.display = 'flex';
            return null;
        }
        return token;
    } catch (error) {
        console.log('Error: ', error);
    }
}