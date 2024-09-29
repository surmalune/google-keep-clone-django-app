import { createElement } from '../ui.js';

import { handleThemeMenuItemClick } from '../handlers.js';

export function openSettingMenu(settingMenu) {
    settingMenu.style.removeProperty('display');
    settingMenu.tabIndex = '0';
}

export function createSettingMenu() {
    const settingMenu = createElement('div', 'setting-menu');
    settingMenu.role = 'menu';

    const themeMenuItem = createSettingMenuItem('Switch theme', handleThemeMenuItemClick);
    settingMenu.appendChild(themeMenuItem);

    return settingMenu;
}

function createSettingMenuItem(text, clickHandler) {
    const menuItem = createElement('div', 'setting-menu-item');
    menuItem.role = 'menuitem';

    const menuItemText = createElement('div', 'setting-menu-item-text', text);
    menuItem.appendChild(menuItemText);
    menuItem.addEventListener('click', clickHandler);

    return menuItem;
}