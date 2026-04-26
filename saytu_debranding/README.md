# Saytu Debranding Module

## Overview

The **Saytu Debranding** module removes all Odoo branding from Odoo 19 Community Edition and replaces it with Saytu branding. This module uses proper Odoo inheritance patterns and doesn't modify any core files, making it safe to install and easy to maintain.

## Features

### ✅ **Branding Points Modified**

| Location | Original | Modified | Status |
|----------|----------|----------|--------|
| **Page Title** | "Odoo" | "Saytu" | ✅ Complete |
| **Login Page Footer** | "Powered by Odoo" link | "Powered by Saytu" text | ✅ Complete |
| **Brand Promotion** | "Powered by Odoo" with logo | "Powered by Saytu" | ✅ Complete |
| **User Menu** | "My Odoo.com Account" | Removed | ✅ Complete |
| **Error Dialogs** | "Odoo Server Error" | "Saytu Server Error" | ✅ Complete |
| **Error Dialogs** | "Odoo Client Error" | "Saytu Client Error" | ✅ Complete |
| **Error Dialogs** | "Odoo Network Error" | "Saytu Network Error" | ✅ Complete |
| **Frontend Logo Alt** | "Logo" | "Saytu" | ✅ Complete |
| **Database Manager** | "Odoo" title | Needs manual update | ⚠️ Partial |
| **Database Manager** | Odoo logo | Needs manual update | ⚠️ Partial |
| **Database Manager** | odoo.com links | Needs manual update | ⚠️ Partial |

### 🎯 **What This Module Does**

1. **Removes "Powered by Odoo" Footer**
   - Login page footer no longer links to odoo.com
   - Replaced with simple "Powered by Saytu" text

2. **Removes "Mon compte Odoo.com" Menu Item**
   - The "My Odoo.com Account" item is removed from the user menu
   - No more links to odoo.com account page

3. **Updates Error Dialog Titles**
   - "Odoo Server Error" → "Saytu Server Error"
   - "Odoo Client Error" → "Saytu Client Error"
   - "Odoo Network Error" → "Saytu Network Error"

4. **Changes Page Titles**
   - Browser tab title changes from "Odoo" to "Saytu"

5. **Removes Brand Promotion**
   - "Powered by Odoo" with logo → "Powered by Saytu" text

## Installation

### Prerequisites

- Odoo 19 Community Edition
- Access to `custom/addons` directory
- Admin rights to install modules

### Steps

1. **Copy the module** to your Odoo addons directory:
   ```bash
   # Module should be at: custom/addons/saytu_debranding/
   ```

2. **Update the apps list**:
   - Go to Apps menu
   - Click "Update Apps List"
   - Search for "Saytu Debranding"

3. **Install the module**:
   - Click "Install" on the Saytu Debranding module

4. **Clear browser cache and refresh**:
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

## Module Structure

```
saytu_debranding/
├── __init__.py                                    # Main init file
├── __manifest__.py                                # Module manifest
├── README.md                                      # This file
├── BRANDING_POINTS.md                             # Detailed list of all branding points
├── CUSTOMIZATION_GUIDE.md                         # Guide for further customization
├── models/
│   └── __init__.py                                # Models init (empty)
├── views/
│   ├── webclient_templates.xml                    # Main template overrides
│   └── database_manager_templates.xml             # Database manager overrides
└── static/src/
    ├── webclient/
    │   ├── user_menu_items.js                     # Remove Odoo.com account menu
    │   └── error_dialogs.js                       # Update error dialog titles
    └── scss/
        └── debranding.scss                        # Additional styling
```

## Technical Details

### Backend (XML Templates)

**File**: `views/webclient_templates.xml`

This file contains XPath-based template inheritance to modify:
- Page title (`web.layout`)
- Login page footer (`web.login_layout`)
- Brand promotion message (`web.brand_promotion_message`)
- Frontend layout logo alt text (`web.frontend_layout`)

### Frontend (JavaScript)

**File**: `static/src/webclient/user_menu_items.js`

Removes the "My Odoo.com Account" menu item from the user menu registry.

**File**: `static/src/webclient/error_dialogs.js`

Patches the `ErrorDialog` component to replace "Odoo" with "Saytu" in error titles.

### Styling (SCSS)

**File**: `static/src/scss/debranding.scss`

Provides additional styling and can hide any remaining Odoo branding elements.

## Customization

### Change Brand Name

To change from "Saytu" to another brand name:

1. **Edit `views/webclient_templates.xml`**:
   - Replace all occurrences of "Saytu" with your brand name

2. **Edit `static/src/webclient/error_dialogs.js`**:
   - Replace "Saytu" with your brand name in error titles

3. **Edit `static/src/scss/debranding.scss`**:
   - Update CSS custom properties if needed

### Add Custom Logo

To add your own logo:

1. **Place your logo** in `static/src/img/logo.png`

2. **Edit `views/webclient_templates.xml`**:
   ```xml
   <xpath expr="//img[@alt='Logo']" position="attributes">
       <attribute name="src">/saytu_debranding/static/src/img/logo.png</attribute>
       <attribute name="alt">Your Brand</attribute>
   </xpath>
   ```

### Add "My Account" Link

To add a custom account link (e.g., "Mon compte Saytu"):

**Edit `static/src/webclient/user_menu_items.js`**:

Uncomment and customize the code at the bottom of the file:

```javascript
import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";

function saytAccountItem(env) {
    return {
        type: "item",
        id: "saytu_account",
        description: _t("Mon compte Saytu"),
        callback: () => {
            browser.open("https://www.saytu.com/account", "_blank");
        },
        sequence: 60,
    };
}

userMenuRegistry.add("saytu_account", saytAccountItem);
```

## Database Manager Debranding

The database manager page (`/web/database/manager`) uses a static HTML file that cannot be easily inherited through XML. To debrand it:

### Option 1: Manual File Edit (Not Recommended)

Edit `addons/web/static/src/public/database_manager.qweb.html`:
- Line 4: Change `<title>Odoo</title>` to `<title>Saytu</title>`
- Line 33: Replace Odoo logo with your logo
- Line 39: Change "Odoo database manager" to "Saytu database manager"
- Line 108: Remove or update the privacy policy link

**Warning**: This modifies core files and will be overwritten on Odoo updates.

### Option 2: Custom Controller (Recommended)

Create a custom controller that serves a modified database manager page. This is more complex but safer.

See `CUSTOMIZATION_GUIDE.md` for detailed instructions.

## Limitations

### What This Module Does NOT Change

1. **Internal Code Comments**: Python/JavaScript comments mentioning "Odoo"
2. **Module Names**: Core module names like `odoo.addons.base`
3. **Python Package Name**: The `odoo` Python package name
4. **Database Manager Static File**: Requires manual intervention (see above)
5. **Some Third-Party Modules**: May have their own Odoo branding

### Community Edition Only

This module is designed for **Odoo 19 Community Edition**. Enterprise Edition has additional branding points that are not covered by this module.

## Compatibility

### Odoo Versions
- ✅ Odoo 19.0 Community Edition (tested)
- ⚠️ Odoo 18.0 (may require adjustments)
- ❌ Odoo 17.0 and below (not compatible)

### Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Other Modules
- ✅ Compatible with most standard Odoo modules
- ⚠️ Some third-party modules may have their own branding

## Troubleshooting

### Branding Still Appears

**Solution**:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R`
3. Restart Odoo server
4. Check module is installed: Apps → Installed → Search "Saytu"

### "My Odoo.com Account" Still Visible

**Solution**:
1. Check JavaScript console for errors (F12)
2. Verify `user_menu_items.js` is loaded in Network tab
3. Clear browser cache and refresh

### Error Dialogs Still Say "Odoo"

**Solution**:
1. Check JavaScript console for errors (F12)
2. Verify `error_dialogs.js` is loaded in Network tab
3. Clear browser cache and refresh

## Security

This module:
- ✅ Does NOT modify core files (uses inheritance)
- ✅ Does NOT change functionality
- ✅ Does NOT affect security
- ✅ Only changes visual branding

## License

This module is licensed under **LGPL-3**.

## Support

For issues or questions:
1. Check this README thoroughly
2. Check `BRANDING_POINTS.md` for complete list of changes
3. Check `CUSTOMIZATION_GUIDE.md` for customization help
4. Check browser console for JavaScript errors (F12)
5. Check Odoo server logs for backend errors

## Credits

**Author**: Custom Development  
**Version**: 19.0.1.0.0  
**Category**: Tools  
**Website**: https://www.saytu.com

---

**Last Updated**: 2025-11-11  
**Status**: ✅ Production Ready

